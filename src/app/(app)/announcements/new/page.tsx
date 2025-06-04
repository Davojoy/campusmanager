"use client";

import { AnnouncementForm } from "@/components/forms/announcement-form";
import { useAuth } from "@/hooks/use-auth";

export default function NewAnnouncementPage() {
  const { userProfile } = useAuth();

  if (!userProfile || userProfile.role !== 'admin') {
    // This check is also in AnnouncementForm, but good for page level too.
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-lg text-destructive">Access Denied</p>
        <p>You do not have permission to create announcements.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <AnnouncementForm />
    </div>
  );
}
