import React from 'react';
// Import Ant Design Layout components and theme hook
import { Layout, theme } from 'antd';
// Import your custom Client Navbar component
import ClientNavbar from '@/Components/ClientNavbar';
import { type PropsWithChildren } from 'react';
// Import Inertia Head for setting page title
import { Head } from '@inertiajs/react';

// Destructure Ant Design Layout components for easier use
const { Header, Content, Footer } = Layout;

// Define the props accepted by this template component
interface ClientLayoutTemplateProps extends PropsWithChildren {
    title?: string; // Optional title for the browser tab/window
}

/**
 * ClientLayoutTemplate Component (Using Ant Design Layout - Updated)
 *
 * Provides the main layout structure for authenticated client pages.
 * Features a sticky top navbar (using ClientNavbar) within an Ant Design Header,
 * and a main content area below.
 */
export default function ClientLayoutTemplate({ children, title }: ClientLayoutTemplateProps) {
    // Use Ant Design's theme hook to get standard tokens like background color for the content area
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
        <>
            {/* Set the page title using Inertia's Head component */}
            {title && <Head title={title} />}

            {/* Ant Design's main Layout container ensures vertical structure */}
            <Layout style={{ minHeight: '100vh' }}>

                {/* Ant Design Header - Styled to match Welcome page navbar */}
                <Header style={{
                    padding: 0,                   // Remove default antd padding
                    background: '#007bff',        // Apply the desired blue background color
                    color: 'white',               // Default text color for container ( overridden by navbar CSS )
                    position: 'sticky',           // Keep header visible on scroll
                    top: 0,                       // Stick to the top
                    zIndex: 10,                   // Ensure header is above content during scroll
                    width: '100%',                // Take full width
                    boxShadow: 'none',            // Remove default antd shadow (optional)
                    height: '64px',               // Define a fixed height for the header (adjust as needed)
                    display: 'flex',              // Use flexbox for alignment
                    alignItems: 'center',         // Vertically center content (the navbar)
                 }}>
                    {/* Render your custom ClientNavbar inside the styled Header */}
                    <ClientNavbar />
                </Header>

                {/* Ant Design Content component - Automatically positioned below Header */}
                <Content style={{
                    padding: '24px', // Add padding around the main content area
                    // Example: Add margin if header wasn't sticky: marginTop: 64, // Match header height
                    }}>
                     {/* Optional inner container for content background/padding */}
                     <div
                        style={{
                          padding: 24, // Inner padding for content block
                          background: colorBgContainer, // Use theme background color for content block
                          borderRadius: borderRadiusLG, // Use theme border radius
                          minHeight: 'calc(100vh - 64px - 45px - 48px)' // Approximate min height calculation (adjust if needed)
                        }}
                      >
                        {/* Render the actual page component's content */}
                        {children}
                      </div>
                </Content>

                {/* Ant Design Footer */}
                <Footer style={{ textAlign: 'center', padding: '12px 50px' }}>
                    National Medical Library Management System ©{new Date().getFullYear()} - Kenya
                </Footer>
            </Layout>
        </>
    );
}
