import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, BookCheck, List, FileText, Users, Clock4, BookPlus, BookMinus } from 'lucide-react'; // Added icons
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Books',
        href: '/books',
        icon: BookOpen,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Penalties',
        href: '/penalties',
        icon: BookCheck,
    },
    {
        title: 'Check Out Books',
        href: '/checkout',
        icon: BookPlus,
    },
    {
        title: 'Check In Books',
        href: '/checkin',
        icon: BookMinus,
    },
    {
        title: 'Borrow Requests',
        href: '/borrow-requests',
        icon: BookMinus,
    },

    {
        title: 'Reports',
        href: '/reports',
        icon: FileText,
    },
    {
        title: 'Overdue Books',
        href: '/overdues',
        icon: Clock4,
    },
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    <AppLogo />
                                    <span style={{marginLeft: '10px', fontSize: '1.2rem'}}>National Medical Library</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
