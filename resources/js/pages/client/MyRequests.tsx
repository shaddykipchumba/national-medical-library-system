// File: resources/js/Pages/Client/MyRequests.tsx

import React from 'react';
import ClientLayout from '@/Layouts/client-layout';
import { Head, Link, router, usePage } from '@inertiajs/react'; // Import router
// Ant Design Imports - Ensure Card is included
import { Table, Tag, Typography, Empty, Space, Button, Popconfirm, Card } from 'antd'; // ****** Card ADDED HERE ******
import { HistoryOutlined, DeleteOutlined } from '@ant-design/icons'; // Import necessary icons
import type { TableProps } from 'antd';
import type { PageProps } from '@/types';
import dayjs from 'dayjs'; // For date formatting
// SweetAlert
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Declare route function if not globally typed
declare function route(name: string, params?: any, absolute?: boolean): string;

// --- TypeScript Interfaces ---
interface BookInfo { id: number; title: string; author: string; }
interface RequestItem { id: number; book: BookInfo | null; status: string; created_at: string; }
interface MyRequestsProps extends PageProps { myRequests: RequestItem[]; }

export default function MyRequests({ myRequests }: MyRequestsProps) {
    const pageTitle = "My Borrow Requests";

    // Helper function for status tag color
    const getStatusColor = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'approved': return 'success';
            case 'pending': return 'processing';
            case 'rejected': case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    // --- Handler to Cancel a Request ---
    const handleCancelRequest = (requestId: number, bookTitle: string | undefined) => {
         MySwal.fire({
            title: 'Cancel Request?',
            html: `Cancel request for <strong>${bookTitle || 'this book'}</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel It',
            confirmButtonColor: '#d33',
            cancelButtonText: 'No',
        }).then((result) => {
            if(result.isConfirmed) {
                // Use Inertia router for DELETE request to the named route
                router.delete(route('api.client.borrow-requests.destroy', requestId), {
                    preserveScroll: true,
                    onSuccess: () => { MySwal.fire('Cancelled!', 'Request cancelled.', 'success'); },
                    onError: (errors) => {
                        const message = Object.values(errors).join(' ') || 'Could not cancel request.';
                        MySwal.fire('Error', message, 'error');
                    },
                });
            }
        });
    }
    // --- End Cancel Request Handler ---


    // --- Table Columns Definition ---
    const columns: TableProps<RequestItem>['columns'] = [
        {
            title: 'Request Date', dataIndex: 'created_at', key: 'requested_date', width: 200,
            render: (date: string) => dayjs(date).isValid() ? dayjs(date).format('DD MMM YYYY, hh:mm A') : 'N/A',
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(), defaultSortOrder: 'descend',
        },
        {
            title: 'Book Title', key: 'title',
            render: (_, record) => record.book?.title ?? <Typography.Text type="secondary">N/A</Typography.Text>,
            sorter: (a, b) => (a.book?.title ?? '').localeCompare(b.book?.title ?? ''),
        },
        {
            title: 'Author', key: 'author',
            render: (_, record) => record.book?.author ?? <Typography.Text type="secondary">N/A</Typography.Text>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', align: 'center', width: 120,
            render: (status: string) => (<Tag color={getStatusColor(status)} style={{ textTransform: 'capitalize' }}>{status}</Tag>),
            filters: [ { text: 'Pending', value: 'pending' }, /* ... other filters */ ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Action', key: 'action', align: 'center', width: 100,
            render: (_, record) => (
                record.status === 'pending' ? (
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}
                        onClick={() => handleCancelRequest(record.id, record.book?.title)}
                        title="Cancel Request"
                    >Cancel</Button>
                ) : null
            ),
        },
    ];
    // --- End Table Column Configuration ---

    return (
        // Use ClientLayout from parent/props
        <>
            <Head title={pageTitle} />

            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
                 <Typography.Title level={2} style={{ margin: 0 }}>
                    <HistoryOutlined style={{ marginRight: '10px' }} />{pageTitle}
                 </Typography.Title>
                 <Typography.Paragraph type="secondary" style={{ marginTop: '8px' }}>
                    View the status of your recent book borrowing requests.
                </Typography.Paragraph>
            </div>

            {/* Requests Table or Empty State */}
            {/* ****** Card component is used here ****** */}
            <Card bordered={false}>
                {myRequests && myRequests.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={myRequests}
                        rowKey="id"
                        pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['15', '30', '50'] }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <Empty description="You haven't made any borrow requests yet." />
                )}
            </Card>
        </>
    );
}

// Assign the layout
MyRequests.layout = (page: React.ReactElement<MyRequestsProps>) => (
    <ClientLayout title="My Borrow Requests" children={page} />
);
