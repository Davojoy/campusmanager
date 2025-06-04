"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  const { userProfile } = useAuth();

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'teacher')) {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary"/>Attendance Management</CardTitle>
                <CardDescription>
                {userProfile.role === 'teacher' ? "Mark student attendance for your courses." :
                "View attendance history and generate reports."}
                </CardDescription>
            </div>
            {userProfile.role === 'admin' && (
                <Link href="/attendance/reports" passHref>
                    <Button variant="outline">View Reports</Button>
                </Link>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Attendance marking and reporting features will be implemented here.</p>
        {userProfile.role === 'teacher' && <p>You will be able to select courses and mark attendance for your students.</p>}
      </CardContent>
    </Card>
  );
}
