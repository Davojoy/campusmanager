"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Megaphone,
  LogOut,
  GraduationCap,
  Settings,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import type { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[]; // Roles that can see this item. Empty array means all authenticated users.
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
  { href: '/students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
  { href: '/courses', label: 'Courses', icon: BookOpen, roles: ['admin', 'teacher'] },
  { href: '/grades', label: 'Grades', icon: GraduationCap, roles: ['admin', 'teacher', 'student'] },
  { href: '/attendance', label: 'Attendance', icon: CalendarDays, roles: ['admin', 'teacher'] },
  { href: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['admin', 'teacher', 'student'] },
];

const adminNavItems: NavItem[] = [
   { href: '/admin/user-management', label: 'User Management', icon: Settings, roles: ['admin'] },
   { href: '/admin/system-settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const userRole = userProfile?.role;

  const isNavItemVisible = (itemRoles: UserRole[]): boolean => {
    if (!userRole) return false;
    if (itemRoles.length === 0) return true; // Visible to all authenticated if roles array is empty
    return itemRoles.includes(userRole);
  };

  return (
    <div className="flex h-full flex-col">
      <SidebarMenu className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          {navItems.filter(item => isNavItemVisible(item.roles)).map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarGroup>
        
        {userRole === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            {adminNavItems.filter(item => isNavItemVisible(item.roles)).map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        )}
      </SidebarMenu>

      <SidebarMenu className="mt-auto">
        <SidebarMenuItem>
          <SidebarMenuButton 
            onClick={logout}
            tooltip={{ children: "Log Out", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            className="hover:bg-destructive hover:text-destructive-foreground text-sidebar-foreground"
          >
            <LogOut />
            <span>Log Out</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
