import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types'; // Your defined PageProps type
import styles from './ClientNavbar.module.css'; // ****** IMPORT CSS MODULE ******

// Declare route function if not globally typed via ziggy.d.ts
declare function route(name: string, params?: any, absolute?: boolean): string;

export default function ClientNavbar() {
    // Access shared props, specifically auth.user which contains client data
    // Ensure your HandleInertiaRequests middleware shares user data for the 'client' guard
    const { auth } = usePage<PageProps>().props;
    const client = auth.user; // Assuming client data is under auth.user

    return (
        // Root element is <nav>, using scoped CSS classes from the module
        <nav className={styles.navbar}>

            {/* Navbar Title */}
            <div className={styles.navbarTitle}>
                National Medical Library (Client Area)
            </div>

            {/* Navbar Links Container */}
            <div className={styles.navbarLinks}>

                {/* Client Navigation Links */}
                <Link href={route('client.home')}>Dashboard</Link>
                <Link href={route('client.books')}>My Books</Link>
                <Link href={route('client.library.browse')}>Browse Library</Link>

                {/* User Info and Logout */}
                {client ? (
                    <>
                        {/* Welcome message - styled via .navbarLinks span in CSS module */}
                        <span>Welcome, {client.name}!</span>

                        {/* Logout Link (styled as button via CSS module) */}
                        <Link
                            href={route('client.logout')} // Points to client logout route
                            method="post"                 // Use POST for logout
                            as="button"                   // Render as button semantically
                            // CSS module styles apply based on the button tag selector in .navbarLinks
                        >
                            Logout
                        </Link>
                    </>
                ) : (
                    // Fallback shouldn't normally be needed if layout is protected by auth:client middleware
                    <>
                        <Link href={route('client.login')}>Login</Link>
                        <Link href={route('client.register')}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
