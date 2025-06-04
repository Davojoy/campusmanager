"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Student, UserProfile } from '@/types'; // Assuming Student type includes basic profile info
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "student"));
        const querySnapshot = await getDocs(q);
        const studentList: Student[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as UserProfile; // UserProfile contains most student fields for this app
          return {
            id: data.uid,
            firstName: data.displayName?.split(' ')[0] || '',
            lastName: data.displayName?.split(' ').slice(1).join(' ') || '',
            email: data.email || '',
            photoUrl: data.photoURL,
            // Add enrollmentDate, dateOfBirth if stored directly on UserProfile or a separate studentProfiles collection
          };
        });
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({ title: "Error", description: "Could not fetch student data.", variant: "destructive" });
      }
      setLoading(false);
    }
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'teacher')) {
      fetchStudents();
    }
  }, [userProfile, toast]);

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    try {
      // This should ideally be a Cloud Function that also deletes auth user and related data
      await deleteDoc(doc(db, "users", studentId)); 
      // await deleteDoc(doc(db, "studentProfiles", studentId)); // If using separate profiles
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast({ title: "Success", description: "Student deleted successfully." });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({ title: "Error", description: "Could not delete student.", variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'teacher')) {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Student Management</CardTitle>
            <CardDescription>View, add, and manage student profiles.</CardDescription>
          </div>
          {userProfile.role === 'admin' && (
            <Link href="/students/new" passHref>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Student</Button>
            </Link>
          )}
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-1/2 lg:w-1/3"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Image 
                      src={student.photoUrl || `https://placehold.co/40x40.png?text=${student.firstName[0]}${student.lastName[0]}`} 
                      alt={`${student.firstName} ${student.lastName}`}
                      width={40} 
                      height={40} 
                      className="rounded-full"
                      data-ai-hint="person avatar"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.enrollmentDate || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/students/${student.id}/details`}> {/* Placeholder */}
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        {userProfile.role === 'admin' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/students/${student.id}/edit`}> {/* Placeholder */}
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
