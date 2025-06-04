"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap } from "lucide-react";

export default function GradesPage() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <p>Loading...</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2"><GraduationCap className="h-6 w-6 text-primary"/>Grade Management</CardTitle>
        <CardDescription>
          {userProfile.role === 'student' ? "View your grades for enrolled courses." :
           userProfile.role === 'teacher' ? "Input and manage grades for students in your courses." :
           "View all grades and generate report cards."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Grade viewing and input features will be implemented here.</p>
        {userProfile.role === 'student' && <p>You will see your grades listed here.</p>}
        {userProfile.role === 'teacher' && <p>You will be able to select courses and input grades for your students.</p>}
        {userProfile.role === 'admin' && <p>You will have access to all student grades and reporting tools.</p>}
      </CardContent>
    </Card>
  );
}
