"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Student } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// This schema might be part of the UserProfile creation rather than a separate Student entity
// For now, focusing on updating user profile directly.
const studentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"), // Usually not editable directly if it's the auth email
  dateOfBirth: z.string().optional(), // Consider date picker
  enrollmentDate: z.string().optional(), // Consider date picker
  photoUrl: z.string().url("Invalid URL for photo").optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student; // For editing existing student
  onSave: (data: StudentFormValues) => Promise<void>;
  isCreating?: boolean; // To differentiate create vs edit if email/password needed for create
}

export function StudentForm({ student, onSave, isCreating = false }: StudentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      email: student?.email || "", // Potentially disabled if editing
      dateOfBirth: student?.dateOfBirth || "",
      enrollmentDate: student?.enrollmentDate || "",
      photoUrl: student?.photoUrl || "",
    },
  });

  const handleSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
      await onSave(data);
      toast({ title: "Success", description: `Student ${student ? 'updated' : 'created'} successfully.` });
      router.push("/students"); // Or to student details page
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save student.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{student ? "Edit Student" : "Add New Student"}</CardTitle>
        <CardDescription>{student ? "Update the student's profile information." : "Enter the details for the new student."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="John" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} disabled={!isCreating} /></FormControl>
                  {isCreating && <FormMessage />}
                  {!isCreating && <p className="text-sm text-muted-foreground">Email cannot be changed after account creation.</p>}
                </FormItem>
              )}
            />
            {/* Add password field if isCreating is true */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL</FormLabel>
                  <FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl>
                  <FormDescription>Enter a URL for the student's profile picture.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {student ? "Save Changes" : "Create Student"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
