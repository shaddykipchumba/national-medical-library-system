import ClientLayoutTemplate from '@/layouts/client/ClientLayoutTemplate'; // Ensure this path points to your ClientLayoutTemplate file
import { type ReactNode } from 'react';

// Props interface for the ClientLayout wrapper - No breadcrumbs
interface ClientLayoutProps {
    children: ReactNode; // Page content
    title?: string; // Optional page title
    [key: string]: any; // Allow other props to be passed through
}

/**
 * ClientLayout Wrapper Component
 *
 * This component acts as a standard wrapper for all authenticated client pages.
 * It applies the ClientLayoutTemplate and passes down relevant props like 'title'.
 * Use this in your client page components like: `YourPage.layout = page => <ClientLayout title="Page Title" children={page} />`
 */
export default function ClientLayout({ children, title, ...props }: ClientLayoutProps) {
    return (
        // Render the base ClientLayoutTemplate, passing the title and any other props
        <ClientLayoutTemplate
            title={title}
            {...props} // Pass any miscellaneous props down to the template
        >
            {/* The actual page content from the specific page component goes here */}
            {children}
        </ClientLayoutTemplate>
    );
}
