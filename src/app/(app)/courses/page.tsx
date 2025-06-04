"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function CoursesPage() {
  const { userProfile } = useAuth();

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'teacher')) {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary"/>Course Management</CardTitle>
            <CardDescription>View, add, and manage courses.</CardDescription>
          </div>
          {userProfile.role === 'admin' && (
            <Link href="/courses/new" passHref>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Course</Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Course listing and management features will be implemented here.</p>
        {/* Placeholder for table or list of courses */}
      </CardContent>
    </Card>
  );
}
