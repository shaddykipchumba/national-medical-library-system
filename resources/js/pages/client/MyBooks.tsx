import React from 'react';
import ClientLayout from '@/Layouts/client-layout'; // Import the client layout
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Table, Tag, Empty, Space } from 'antd';
import { BookOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd'; // Import TableProps type for columns
import dayjs from 'dayjs'; // Import dayjs for date formatting (npm install dayjs)
import relativeTime from 'dayjs/plugin/relativeTime'; // Import plugin for relative time

dayjs.extend(relativeTime); // Extend dayjs with the relativeTime plugin

// Declare route function if not globally typed
declare function route(name: string, params?: any, absolute?: boolean): string;

// Define the expected structure of a borrowed book item
interface BookItem {
    id: number | string; // Unique key for the row (e.g., assigned book record ID or book_number)
    title: string;
    book_number: string;
    borrowed_date: string;
    due_date: string;
}

// Define the props passed to the page component
interface MyBooksProps {
    borrowedBooks: BookItem[]; // Array of borrowed books passed from the controller
}

export default function MyBooks({ borrowedBooks }: MyBooksProps) {
    const pageTitle = "My Borrowed Books";

    // --- Ant Design Table Column Configuration ---
    const columns: TableProps<BookItem>['columns'] = [
        {
            title: 'Book Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title), // Enable sorting by title
        },
        {
            title: 'Book Number',
            dataIndex: 'book_number',
            key: 'book_number',
        },
        {
            title: 'Borrowed Date',
            dataIndex: 'borrowed_date',
            key: 'borrowed_date',
            render: (text: string) => dayjs(text).isValid() ? dayjs(text).format('DD MMM YYYY') : 'N/A', // Format date
            sorter: (a, b) => dayjs(a.borrowed_date).unix() - dayjs(b.borrowed_date).unix(), // Enable sorting by date
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (text: string) => {
                const dueDate = dayjs(text);
                if (!dueDate.isValid()) return 'N/A';

                const now = dayjs();
                const isOverdue = dueDate.isBefore(now, 'day'); // Check if overdue (ignoring time)
                const diffDays = dueDate.diff(now, 'day'); // Calculate difference in days

                let color = diffDays < 3 ? 'warning' : 'default'; // Warning if due in less than 3 days
                if (isOverdue) color = 'error'; // Error if overdue

                return (
                    <Tag color={color} icon={<CalendarOutlined />}>
                        {dueDate.format('DD MMM YYYY')} ({dueDate.fromNow()}) {/* Show relative time */}
                    </Tag>
                );
            },
            sorter: (a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix(), // Enable sorting by date
        },
        // Add more columns if needed, e.g., actions like 'Renew'
        // {
        //     title: 'Action',
        //     key: 'action',
        //     render: (_, record) => (
        //         <Space size="middle">
        //             <Button size="small" disabled>Renew</Button> {/* Placeholder */}
        //         </Space>
        //     ),
        // },
    ];
    // --- End Table Column Configuration ---

    return (
        <>
            <Head title={pageTitle} />

            <div style={{ marginBottom: '24px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Typography.Title level={2} style={{ margin: 0 }}>
                            <BookOutlined style={{ marginRight: '10px' }} />{pageTitle}
                        </Typography.Title>
                    </Col>
                    <Col>
                         {/* Link styled as a button to the library browse page */}
                        <Link href={route('client.library.browse')}>
                            <Button type="primary" icon={<PlusOutlined />}>
                                Borrow Book
                            </Button>
                        </Link>
                    </Col>
                </Row>
                 <Typography.Paragraph type="secondary" style={{ marginTop: '8px' }}>
                    Here is a list of books you currently have borrowed from the library. Please keep track of the due dates.
                </Typography.Paragraph>
            </div>

            <Card bordered={false}>
                {borrowedBooks && borrowedBooks.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={borrowedBooks}
                        rowKey="id" // Use the unique key from your data (e.g., 'id', 'book_number')
                        pagination={{ pageSize: 10 }} // Optional: configure pagination
                        scroll={{ x: 'max-content' }} // Enable horizontal scroll on small screens
                    />
                ) : (
                    <Empty description="You have not borrowed any books yet." />
                )}
            </Card>
        </>
    );
}

// Assign the layout to the page
MyBooks.layout = (page: React.ReactElement) => (
    <ClientLayout title="My Books" children={page} />
);
