// File: resources/js/Pages/Client/Dashboard.tsx

import React from 'react';
import ClientLayout from '@/Layouts/client-layout'; // Import the correct client layout
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Statistic, Space } from 'antd'; // Import Ant Design components
// Import all necessary icons
import { BookOutlined, PlusCircleOutlined, SmileOutlined, HistoryOutlined } from '@ant-design/icons';
import { PageProps } from '@/types'; // Your defined PageProps type

// Declare route function if not globally typed by Ziggy/TypeScript setup
declare function route(name: string, params?: any, absolute?: boolean): string;

// Define the props expected by this page component, including data passed from the controller
interface ClientDashboardProps extends PageProps {
    borrowedCount: number; // The count of currently borrowed books
    // Add any other props passed from ClientAreaController@dashboard here
}

export default function ClientDashboard({ borrowedCount }: ClientDashboardProps) {
    // Get shared props, including authenticated user (client) information
    const { auth } = usePage<ClientDashboardProps>().props;
    const client = auth.user; // Assuming client data is under auth.user
    const pageTitle = "Client Dashboard"; // Title for the browser tab

    return (
        // Return ONLY the page-specific content, usually wrapped in a fragment <>...</>
        // DO NOT wrap this return block in <ClientLayout> here.
        <>
            {/* Set the document head title */}
            <Head title={pageTitle} />

            {/* Welcome Section Card */}
            <Card bordered={false} style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ece9e6 0%, #ffffff 100%)' }}>
                <Row align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={4} md={3} lg={2} style={{ textAlign: 'center' }}>
                         <SmileOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
                    </Col>
                    <Col xs={24} sm={20} md={21} lg={22}>
                        <Typography.Title level={2} style={{ marginBottom: '4px' }}>
                            Karibu, {client?.name || 'Client'}! {/* Welcome message */}
                        </Typography.Title>
                        <Typography.Paragraph type="secondary" style={{ fontSize: '1rem' }}>
                            Welcome to your National Medical Library dashboard. Manage your borrowed books and explore our resources.
                        </Typography.Paragraph>
                         {/* Display the count passed from the controller */}
                        <Typography.Paragraph style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                            You currently have <strong style={{ color: '#1890ff' }}>{borrowedCount}</strong> book(s) borrowed.
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Card>

            {/* Quick Actions Section */}
            <Typography.Title level={3} style={{ marginBottom: '16px' }}>Quick Actions</Typography.Title>
            {/* Responsive Grid for Action Cards */}
            <Row gutter={[16, 24]}> {/* Use vertical gutter */}
                {/* My Books Card */}
                <Col xs={24} md={12} lg={8} style={{ display: 'flex' }}>
                    <Card
                        hoverable
                        title={<span><BookOutlined style={{ marginRight: 8 }} /> My Books</span>}
                        bordered={false}
                        style={{ width: '100%', height: '100%' }} // Fill column height
                        actions={[
                            // Link to the client's borrowed books page
                             <Link href={route('client.books')} key="view_books">
                                <Button type="primary">View My Books</Button>
                            </Link>
                        ]}
                    >
                        <Typography.Paragraph>
                            Keep track of the books you currently have borrowed, check due dates, and manage renewals right here.
                        </Typography.Paragraph>
                         {/* Repeat count here for context */}
                         <p>Borrowed Count: <strong>{borrowedCount}</strong></p>
                    </Card>
                </Col>

                {/* Borrow Now Card */}
                <Col xs={24} md={12} lg={8} style={{ display: 'flex' }}>
                    <Card
                        hoverable
                        title={<span><PlusCircleOutlined style={{ marginRight: 8 }}/> Borrow a Book</span>}
                        bordered={false}
                        style={{ width: '100%', height: '100%' }}
                        actions={[
                            // Link to the library Browse page
                             <Link href={route('client.library.browse')} key="borrow_now">
                                <Button type="primary">Explore & Borrow</Button>
                             </Link>
                        ]}
                    >
                        <Typography.Paragraph>
                           Ready for your next read? Browse our extensive collection and check out books instantly or submit a borrow request.
                        </Typography.Paragraph>
                    </Card>
                </Col>

                {/* My Requests Card */}
                <Col xs={24} md={12} lg={8} style={{ display: 'flex' }}>
                    <Card
                        hoverable
                        title={<span><HistoryOutlined style={{ marginRight: 8 }} /> My Requests</span>}
                        bordered={false}
                        style={{ width: '100%', height: '100%' }}
                        actions={[
                            // Link to the client's borrow requests page
                             <Link href={route('client.requests.index')} key="view_requests">
                                <Button type="primary">View My Requests</Button>
                             </Link>
                        ]}
                    >
                        <Typography.Paragraph>
                            Track the status of your book borrowing requests. See if they are pending review, approved for pickup, or have been rejected. Stay updated!
                        </Typography.Paragraph>
                    </Card>
                </Col>
                 {/* End My Requests Card */}
            </Row>
        </> // End of Fragment
    ); // End of return statement
} // End of component function

// Assign the layout to the page SEPARATELY
// This tells Inertia to wrap the page content returned above with the ClientLayout
ClientDashboard.layout = (page: React.ReactElement<ClientDashboardProps>) => (
    <ClientLayout title="Client Dashboard" children={page} />
);
