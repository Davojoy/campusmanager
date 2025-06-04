"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateContextAwareAnnouncement } from '@/ai/flows/generate-announcement';
import type { Announcement, UserProfile } from '@/types';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Link from 'next/link';
import { PlusCircle, Megaphone, Loader2, Info } from 'lucide-react';

interface DisplayAnnouncement extends Announcement {
  tailoredContent: string;
}

export default function AnnouncementsPage() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<DisplayAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndTailorAnnouncements() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(announcementsQuery);
        const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));

        const tailoredAnnouncements: DisplayAnnouncement[] = [];
        for (const ann of fetchedAnnouncements) {
          try {
            const result = await generateContextAwareAnnouncement({ announcementContent: ann.originalContent });
            let contentForRole = "";
            if (userProfile.role === 'student') contentForRole = result.studentAnnouncement;
            else if (userProfile.role === 'teacher') contentForRole = result.teacherAnnouncement;
            else if (userProfile.role === 'admin') contentForRole = result.administratorAnnouncement;
            else contentForRole = ann.originalContent; // Fallback for unknown roles or if no tailored content

            tailoredAnnouncements.push({ ...ann, tailoredContent: contentForRole });
          } catch (aiError) {
            console.error("Error tailoring announcement ID " + ann.id + ":", aiError);
            // Fallback to original content if AI fails
            tailoredAnnouncements.push({ ...ann, tailoredContent: `Error tailoring announcement: ${ann.originalContent}` });
          }
        }
        setAnnouncements(tailoredAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
      setLoading(false);
    }

    fetchAndTailorAnnouncements();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userProfile) {
     return <p>Please log in to view announcements.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary"/>Announcements</CardTitle>
              <CardDescription>Stay updated with the latest news and notices.</CardDescription>
            </div>
            {userProfile.role === 'admin' && (
              <Link href="/announcements/new" passHref>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Announcement</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Announcements Yet</AlertTitle>
              <AlertDescription>
                There are currently no announcements. Check back later!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <Card key={ann.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">{ann.title}</CardTitle>
                    <CardDescription>
                      Posted on: {new Date(ann.createdAt.toDate()).toLocaleDateString()}
                      {userProfile.role === 'admin' && ` (by ${ann.createdBy})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none p-3 bg-muted rounded-md text-foreground">
                      {/* Using dangerouslySetInnerHTML for potential rich text/HTML from AI. Sanitize if needed. */}
                      <p dangerouslySetInnerHTML={{ __html: ann.tailoredContent.replace(/\n/g, '<br />') }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
