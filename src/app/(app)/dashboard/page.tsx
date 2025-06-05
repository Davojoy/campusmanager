
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, BookOpen, BarChart3, Lightbulb, Send, DatabaseZap } from 'lucide-react';
import { generateProactiveSuggestions, type ProactiveSuggestionsInput } from '@/ai/flows/proactive-suggestions';
import { generateContextAwareAnnouncement } from '@/ai/flows/generate-announcement';
import type { Announcement, UserProfile } from '@/types';
import { collection, query, where, getDocs, serverTimestamp, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { seedFirestoreData } from '@/lib/firebase/seedData'; // Import the seed function
import { useToast } from '@/hooks/use-toast'; // Import useToast


// Mock data - replace with actual Firestore queries
const MOCK_STUDENT_DATA_SUMMARY = "Student A: Grades - Math B, Science A, English C. Attendance - 90%. Student B: Grades - Math C, Science B, English B. Attendance - 75%.";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState({ totalStudents: 0, totalTeachers: 0, totalCourses: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [tailoredAnnouncement, setTailoredAnnouncement] = useState<string>("");
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false); // State for seeding
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    async function fetchDashboardData() {
      if (!userProfile) return;
      setLoadingMetrics(true);
      try {
        if (userProfile.role === 'admin') {
          const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
          const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
          const coursesQuery = collection(db, 'courses');
          
          const [studentsSnap, teachersSnap, coursesSnap] = await Promise.all([
            getDocs(studentsQuery),
            getDocs(teachersQuery),
            getDocs(coursesQuery),
          ]);
          
          setMetrics({
            totalStudents: studentsSnap.size,
            totalTeachers: teachersSnap.size,
            totalCourses: coursesSnap.size,
          });
        }
        // Add teacher specific metrics if needed
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
      }
      setLoadingMetrics(false);
    }

    async function fetchLatestAnnouncement() {
      if (!userProfile) return;
      setLoadingAnnouncement(true);
      try {
        const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
        const announcementSnap = await getDocs(announcementsQuery);
        if (!announcementSnap.empty) {
          const annData = announcementSnap.docs[0].data() as Announcement;
          setLatestAnnouncement({...annData, id: announcementSnap.docs[0].id});
          
          const result = await generateContextAwareAnnouncement({ announcementContent: annData.originalContent });
          if (userProfile.role === 'student') setTailoredAnnouncement(result.studentAnnouncement);
          else if (userProfile.role === 'teacher') setTailoredAnnouncement(result.teacherAnnouncement);
          else if (userProfile.role === 'admin') setTailoredAnnouncement(result.administratorAnnouncement);

        }
      } catch (error) {
        console.error("Error fetching or tailoring announcement:", error);
      }
      setLoadingAnnouncement(false);
    }

    fetchDashboardData();
    fetchLatestAnnouncement();
  }, [userProfile]);

  useEffect(() => {
    if (latestAnnouncement?.createdAt) {
      if (typeof latestAnnouncement.createdAt.toDate === 'function') {
        setFormattedCreatedAt(new Date(latestAnnouncement.createdAt.toDate()).toLocaleDateString());
      } else {
        try {
          setFormattedCreatedAt(new Date(latestAnnouncement.createdAt as any).toLocaleDateString());
        } catch (e) {
          console.error("Error formatting announcement date in useEffect:", e);
          setFormattedCreatedAt('Date unavailable');
        }
      }
    } else {
      setFormattedCreatedAt('');
    }
  }, [latestAnnouncement]);

  const handleGenerateSuggestions = async () => {
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'teacher')) return;
    setLoadingSuggestions(true);
    try {
      const input: ProactiveSuggestionsInput = {
        // In a real app, fetch relevant student data based on user role
        studentsData: MOCK_STUDENT_DATA_SUMMARY, 
        userRole: userProfile.role as 'admin' | 'teacher',
      };
      const result = await generateProactiveSuggestions(input);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Error generating proactive suggestions:", error);
      setSuggestions(['Failed to load suggestions.']);
    }
    setLoadingSuggestions(false);
  };

  const handleSeedData = async () => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({ title: "Unauthorized", description: "Only admins can seed data.", variant: "destructive" });
      return;
    }
    setIsSeeding(true);
    try {
      await seedFirestoreData(userProfile.uid); // Pass admin UID for 'createdBy' fields
      toast({ title: "Success", description: "Dummy data seeded successfully!" });
      // Optionally, refresh metrics or other data shown on dashboard
    } catch (error: any) {
      console.error("Error seeding data:", error);
      toast({ title: "Error Seeding Data", description: error.message || "Failed to seed dummy data.", variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!userProfile) {
    return <div className="text-center p-8">Loading user profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome, {userProfile.displayName}!</CardTitle>
          <CardDescription>Your personalized CampusManager dashboard.</CardDescription>
        </CardHeader>
      </Card>

      {userProfile.role === 'admin' && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Key Metrics</h2>
          {loadingMetrics ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalStudents}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTeachers}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalCourses}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      )}

      {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-accent h-6 w-6" /> Proactive Suggestions</CardTitle>
            <CardDescription>AI-powered insights to help you manage effectively.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateSuggestions} disabled={loadingSuggestions || isSeeding} className="mb-4">
              {loadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              Generate Suggestions
            </Button>
            {suggestions.length > 0 && (
              <Alert variant="default" className="bg-accent/10 border-accent/50">
                <Lightbulb className="h-5 w-5 text-accent" />
                <AlertTitle className="text-accent">Suggestions</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Latest Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnnouncement ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : 
            latestAnnouncement ? (
            <div>
              <h3 className="text-lg font-semibold mb-1">{latestAnnouncement.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Posted on: {formattedCreatedAt || 'Loading date...'}
              </p>
              <div className="prose prose-sm max-w-none p-3 bg-muted rounded-md">
                <p className="font-semibold">For {userProfile.role}s:</p>
                {tailoredAnnouncement ? (
                    <div dangerouslySetInnerHTML={{ __html: tailoredAnnouncement.replace(/\n/g, '<br />') }} />
                ) : (
                    "No tailored content available."
                )}
              </div>
            </div>
          ) : (
            <p>No announcements available.</p>
          )}
        </CardContent>
      </Card>

      {userProfile.role === 'admin' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DatabaseZap className="text-accent h-6 w-6" /> Seed Database</CardTitle>
            <CardDescription>Populate Firestore with dummy data for testing purposes. (Admin Only)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedData} disabled={isSeeding} className="mb-4">
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
              Seed Dummy Data
            </Button>
            <Alert variant="destructive">
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                This will add multiple new documents to your Firestore database. Use with caution, especially on a production environment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

