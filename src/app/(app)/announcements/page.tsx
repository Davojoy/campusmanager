
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateContextAwareAnnouncement } from '@/ai/flows/generate-announcement';
import type { Announcement, UserProfile } from '@/types';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Link from 'next/link';
import { PlusCircle, Megaphone, Loader2, Info, RefreshCw } from 'lucide-react';

interface DisplayAnnouncement extends Announcement {
  tailoredContent: string | null; // Null initially, then string
  isTailoring: boolean;
  tailoringError: boolean;
}

export default function AnnouncementsPage() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<DisplayAnnouncement[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const tailorAnnouncement = useCallback(async (ann: Announcement, profile: UserProfile) => {
    try {
      const result = await generateContextAwareAnnouncement({ announcementContent: ann.originalContent });
      let contentForRole = "";
      if (profile.role === 'student') contentForRole = result.studentAnnouncement;
      else if (profile.role === 'teacher') contentForRole = result.teacherAnnouncement;
      else if (profile.role === 'admin') contentForRole = result.administratorAnnouncement;
      else contentForRole = ann.originalContent; // Fallback

      return contentForRole;
    } catch (aiError) {
      console.error("Error tailoring announcement ID " + ann.id + ":", aiError);
      throw aiError; // Re-throw to be caught by the caller
    }
  }, []);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!userProfile) return;
      setLoadingInitial(true);
      try {
        const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(announcementsQuery);
        const fetchedAnnouncements = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          tailoredContent: null, // Initialize
          isTailoring: false,     // Initialize
          tailoringError: false,  // Initialize
        } as DisplayAnnouncement));
        
        setAnnouncements(fetchedAnnouncements);
        setLoadingInitial(false);

        // Sequentially trigger tailoring for each announcement
        fetchedAnnouncements.forEach(ann => {
          if (userProfile) { // Ensure userProfile is still valid
            setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isTailoring: true, tailoringError: false } : a));
            tailorAnnouncement(ann, userProfile)
              .then(tailoredContent => {
                setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, tailoredContent, isTailoring: false } : a));
              })
              .catch(() => {
                setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, tailoredContent: ann.originalContent, isTailoring: false, tailoringError: true } : a));
              });
          }
        });

      } catch (error) {
        console.error("Error fetching announcements:", error);
        setLoadingInitial(false);
      }
    }

    fetchAnnouncements();
  }, [userProfile, tailorAnnouncement]);

  const retryTailoring = (announcementId: string) => {
    const announcementToRetry = announcements.find(ann => ann.id === announcementId);
    if (announcementToRetry && userProfile) {
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, isTailoring: true, tailoringError: false } : a));
      tailorAnnouncement(announcementToRetry, userProfile)
        .then(tailoredContent => {
          setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, tailoredContent, isTailoring: false } : a));
        })
        .catch(() => {
          setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, tailoredContent: announcementToRetry.originalContent, isTailoring: false, tailoringError: true } : a));
        });
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading announcements...</p>
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
                      {ann.isTailoring ? (
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                          <span>Tailoring content for your role...</span>
                        </div>
                      ) : ann.tailoringError ? (
                        <div>
                          <p className="text-destructive">Could not tailor announcement. Showing original content.</p>
                          <p dangerouslySetInnerHTML={{ __html: ann.originalContent.replace(/\n/g, '<br />') }} />
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => retryTailoring(ann.id)}>
                            <RefreshCw className="mr-2 h-4 w-4"/> Retry
                          </Button>
                        </div>
                      ) : ann.tailoredContent ? (
                        <p dangerouslySetInnerHTML={{ __html: ann.tailoredContent.replace(/\n/g, '<br />') }} />
                      ) : (
                         <p dangerouslySetInnerHTML={{ __html: ann.originalContent.replace(/\n/g, '<br />') }} />
                      )}
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

