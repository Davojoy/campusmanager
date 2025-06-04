"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

const announcementFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  originalContent: z.string().min(10, "Content must be at least 10 characters long."),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export function AnnouncementForm() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      originalContent: "",
    },
  });

  const onSubmit = async (data: AnnouncementFormValues) => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({ title: "Unauthorized", description: "You are not authorized to create announcements.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await addDoc(collection(db, "announcements"), {
        ...data,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Announcement created successfully." });
      router.push("/announcements");
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast({ title: "Error", description: error.message || "Failed to create announcement.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return <p>Access Denied. Only administrators can create announcements.</p>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2"><Send className="h-6 w-6 text-primary"/>Create New Announcement</CardTitle>
        <CardDescription>Craft and publish announcements for the campus community.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="E.g., Upcoming Holiday Schedule" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea placeholder="Enter the full announcement details here..." {...field} rows={8} /></FormControl>
                  <FormDescription>This content will be adapted by AI for different user roles.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Announcement
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

