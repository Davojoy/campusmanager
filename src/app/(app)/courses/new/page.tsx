
"use client";

import { CourseForm } from "@/components/forms/course-form";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Course } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Define the data structure expected from the form, excluding the auto-generated id
type NewCourseData = Omit<Course, 'id' | 'studentIds'> & { teacherId?: string };

export default function NewCoursePage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCourse = async (data: NewCourseData) => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({ title: "Unauthorized", description: "You do not have permission to create courses.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const courseData = {
        ...data,
        // studentIds: [], // Initialize if needed, or handle separately
        createdAt: serverTimestamp(), // Optional: for tracking creation time
        createdBy: userProfile.uid,   // Optional: for tracking who created it
      };
      await addDoc(collection(db, "courses"), courseData);
      toast({ title: "Success", description: "Course created successfully." });
      router.push("/courses");
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast({ title: "Error", description: error.message || "Failed to create course.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-lg text-destructive">Access Denied</p>
        <p>You do not have permission to create new courses.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <CourseForm onSave={handleCreateCourse} isSubmitting={isSubmitting} />
    </div>
  );
}
