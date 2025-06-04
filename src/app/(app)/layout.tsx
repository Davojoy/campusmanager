"use client";

import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/global/loading-screen";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarInset,
  SidebarRail,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2 } from "lucide-react"; // Campus/Building icon


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, isAuthenticating, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticating && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthenticating, router]);

  if (isAuthenticating || loading || !currentUser || !userProfile) {
    return <LoadingScreen />;
  }
  
  // TODO: Extract pageTitle dynamically based on route or a context
  // For now, a placeholder. This should be managed by individual pages.
  const pageTitle = "Dashboard"; 

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2 rounded-lg">
                <Building2 className="h-7 w-7 text-primary-foreground" />
             </div>
            <h1 className="font-headline text-2xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">CampusManager</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
