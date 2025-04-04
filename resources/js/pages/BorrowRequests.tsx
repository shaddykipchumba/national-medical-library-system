import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout'; // Use your Admin Layout
import { Head, Link, router, usePage } from '@inertiajs/react';
// Ant Design Imports
import { Table, Tag, Typography, Empty, Space, Button, Select, Spin, Card, Modal, Form, DatePicker } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined, HistoryOutlined } from '@ant-design/icons';
// Ant Design & Other Types
import type { TableProps } from 'antd';
import type { PageProps } from '@/types'; // Your global PageProps type
import type { Dayjs } from 'dayjs'; // Import Dayjs type if using DatePicker
import dayjs from 'dayjs'; // For date formatting and default dates
// SweetAlert for confirmations/feedback
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const { Option } = Select;

// Declare route function if not globally typed by Ziggy/TypeScript setup
declare function route(name: string, params?: any, absolute?: boolean): string;

// --- TypeScript Interfaces ---

interface ClientInfo { id: number; name: string; email: string; }
interface BookInfo { id: number; title: string; }
interface BorrowRequestItem {
    id: number;
    client: ClientInfo | null;
    book: BookInfo | null;
    status: string;
    created_at: string;
}
// Structure for Laravel Paginator Object
interface Paginator<T> { data: T[]; links: any[]; current_page: number; last_page: number; total: number; per_page: number; path: string; prev_page_url: string | null; next_page_url: string | null; /* ... */ }
// Props received by this Admin page component
interface AdminBorrowRequestsProps extends PageProps {
    borrowRequests: Paginator<BorrowRequestItem>;
    filters?: { search?: string; status?: string; }; // Optional filters
}
// Structure for available book number data used in the dropdown
interface AvailableNumber {
    id: number; // ID of the BookNumber record
    book_number: string;
}
// Structure for the Approval Form data
interface ApproveFormData {
    book_number_id: number | null;
    date_to_be_returned: Dayjs | null;
}

// --- Component Definition ---
export default function AdminBorrowRequests({ borrowRequests, filters }: AdminBorrowRequestsProps) {
    const pageTitle = "Manage Borrow Requests";
    // State for row action button loading indicator
    const [loadingAction, setLoadingAction] = useState<number | null>(null);
    // State for Approval Modal
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<BorrowRequestItem | null>(null);
    const [availableNumbersForModal, setAvailableNumbersForModal] = useState<AvailableNumber[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false); // Loading inside the modal
    const [approveForm] = Form.useForm<ApproveFormData>(); // Form instance for modal

    // --- Handlers ---

    // Fetch Available Book Numbers via API
    const fetchAvailableNumbers = async (bookId: number): Promise<AvailableNumber[]> => {
        setIsModalLoading(true);
        try {
            // Use correct route name for fetching available numbers
            const response = await fetch(route('api.books.available-numbers', { book: bookId }));
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch available numbers');
            }
            const data = await response.json();
            return data.available_numbers || [];
        } catch (error) {
            console.error("Error fetching available numbers:", error);
            MySwal.fire('Error', `Could not load available book copies: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            return [];
        } finally {
            setIsModalLoading(false);
        }
    };

    // Show Approval Modal after fetching available numbers
    const showApproveModal = async (request: BorrowRequestItem) => {
        if (!request.book) {
             MySwal.fire('Error', 'Request data is incomplete (missing book details).', 'error');
             return;
        }
        setCurrentRequest(request);
        approveForm.resetFields();
        setIsApproveModalOpen(true); // Open modal (shows spinner)
        const numbers = await fetchAvailableNumbers(request.book.id);
        setAvailableNumbersForModal(numbers);
        if (numbers.length > 0) {
            // Set default return date (e.g., 14 days from now using dayjs)
            approveForm.setFieldsValue({ date_to_be_returned: dayjs().add(14, 'day') });
        } else {
             MySwal.fire('Unavailable', `No available copies found for "${request.book.title}". Cannot approve.`, 'warning');
             // Keep modal open to show message, or close it:
             // setIsApproveModalOpen(false);
             // setCurrentRequest(null);
        }
    };

    // Close the approval modal
    const handleCancelModal = () => {
        setIsApproveModalOpen(false);
        setCurrentRequest(null);
        setAvailableNumbersForModal([]);
        approveForm.resetFields();
    };

    // Handle Approval Form Submission (from Modal OK button)
    const handleApproveSubmit = async (values: ApproveFormData) => {
        if (!currentRequest) return;

        const payload = {
            status: 'approved',
            book_number_id: values.book_number_id,
            date_to_be_returned: values.date_to_be_returned?.format('YYYY-MM-DD')
        };

        setLoadingAction(currentRequest.id); // Indicate loading state

        // Use Inertia router to send PUT request
        // *** FIX: Use snake_case 'borrow_request' for route parameter ***
        router.put(route('api.borrow-requests.update', { borrow_request: currentRequest.id }), payload, {
            preserveScroll: true,
            onSuccess: () => {
                MySwal.fire('Approved!', 'Request approved and book assigned.', 'success');
                handleCancelModal(); // Close modal on success
            },
            onError: (errors) => {
                MySwal.fire('Approval Error', Object.values(errors).join(' ') || 'Failed to approve request.', 'error');
                // Keep modal open on error for correction
            },
            onFinish: () => setLoadingAction(null), // Clear loading indicator
         });
    };

    // Handle Reject Action
    const handleReject = (request: BorrowRequestItem) => {
         MySwal.fire({
            title: 'Reject Request?',
            html: `Reject request for <strong>${request.book?.title || 'this book'}</strong> by ${request.client?.name || 'client'}?`,
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, Reject',
            confirmButtonColor: '#d33', cancelButtonText: 'No', reverseButtons: true
         }).then((result) => {
             if(result.isConfirmed) {
                 setLoadingAction(request.id);
                 // *** FIX: Use snake_case 'borrow_request' for route parameter ***
                 router.put(route('api.borrow-requests.update', { borrow_request: request.id }), {
                    status: 'rejected',
                 }, {
                    preserveScroll: true,
                    onSuccess: () => MySwal.fire('Rejected!', 'Request has been rejected.', 'success'),
                    onError: (errors) => MySwal.fire('Rejection Error', Object.values(errors).join(' ') || 'Failed to reject request.', 'error'),
                    onFinish: () => setLoadingAction(null),
                 });
             }
         });
    };

    // --- Table Columns Configuration ---
    const columns: TableProps<BorrowRequestItem>['columns'] = [
        { title: 'Req. Date', dataIndex: 'created_at', key: 'date', width: 180, render: (d) => dayjs(d).format('DD MMM YY, h:mm A'), sorter: (a,b)=>dayjs(a.created_at).unix()-dayjs(b.created_at).unix(), defaultSortOrder: 'descend'},
        { title: 'Client Name', key: 'client_name', render: (_, r) => r.client?.name || 'N/A', ellipsis: true },
        { title: 'Client Email', key: 'client_email', render: (_, r) => r.client?.email || 'N/A', ellipsis: true },
        { title: 'Book Title', key: 'book_title', render: (_, r) => r.book?.title || <Typography.Text type="secondary">N/A</Typography.Text>, ellipsis: true},
        {
            title: 'Status', dataIndex: 'status', key: 'status', align: 'center', width: 120,
            render: (s) => <Tag color={s === 'pending' ? 'processing' : s === 'approved' ? 'success' : 'error'} style={{ textTransform: 'capitalize' }}>{s}</Tag>,
            filters: [{text:'Pending', value:'pending'},{text:'Approved', value:'approved'},{text:'Rejected', value:'rejected'}],
            filteredValue: filters?.status ? [filters.status] : null,
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Action', key: 'action', align: 'center', width: 150, fixed: 'right',
            render: (_, record) => (
                record.status === 'pending' ? (
                    <Space size="small">
                        <Button title="Approve Request" type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => showApproveModal(record)} loading={loadingAction === record.id} disabled={loadingAction !== null} > Approve </Button>
                        <Button title="Reject Request" type="default" danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleReject(record)} loading={loadingAction === record.id} disabled={loadingAction !== null} > Reject </Button>
                    </Space>
                ) : (<Typography.Text type="secondary" italic>Processed</Typography.Text>)
            ),
        },
    ];

    // --- Component Return JSX ---
    return (
        <AppLayout> {/* Removed breadcrumbs prop */}
            <Head title={pageTitle} />
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Typography.Title level={2}>{pageTitle}</Typography.Title>
                {/* Add Filters/Search Inputs Here Later */}
                <Card bordered={false}>
                    <Table<BorrowRequestItem>
                        dataSource={borrowRequests.data}
                        columns={columns}
                        rowKey="id"
                        loading={usePage<AdminBorrowRequestsProps>().props.inertia?.processing && loadingAction === null}
                        scroll={{ x: 'max-content' }}
                        pagination={{
                             current: borrowRequests.current_page, pageSize: borrowRequests.per_page, total: borrowRequests.total, showSizeChanger: false,
                             itemRender: (page, type, originalElement) => {
                                 const link = borrowRequests.links.find(l => l.label.includes(String(page)) || (type === 'prev' && l.label.includes('Previous')) || (type === 'next' && l.label.includes('Next')));
                                 if (type === 'page' || type === 'prev' || type === 'next') {
                                     return <Link href={link?.url ?? '#'} preserveState preserveScroll disabled={!link?.url}>{originalElement}</Link>;
                                 }
                                 return originalElement;
                             }
                         }}
                        size="middle"
                    />
                </Card>
            </Space>

            {/* Approval Modal */}
            <Modal
                title="Approve Borrow Request"
                open={isApproveModalOpen}
                onOk={() => approveForm.submit()}
                onCancel={handleCancelModal}
                confirmLoading={loadingAction === currentRequest?.id}
                okText="Approve & Assign"
                destroyOnClose maskClosable={false}
            >
                {isModalLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}> <Spin size="large" tip="Loading available copies..."/> </div>
                 ) : (
                    <Form form={approveForm} layout="vertical" name="approve_request_form" onFinish={handleApproveSubmit}>
                        {/* Info display */}
                        <Typography.Paragraph><strong>Book:</strong> {currentRequest?.book?.title}</Typography.Paragraph>
                        <Typography.Paragraph><strong>Client:</strong> {currentRequest?.client?.name} ({currentRequest?.client?.email})</Typography.Paragraph>
                        <Typography.Paragraph><strong>Requested:</strong> {currentRequest?.created_at ? dayjs(currentRequest.created_at).format('DD MMM YY, h:mm A') : 'N/A'}</Typography.Paragraph>
                        <hr style={{ margin: '16px 0' }} />

                        {/* Book Number Selection */}
                        <Form.Item label="Select Available Copy to Assign" name="book_number_id" rules={[{ required: true, message: 'Please select the book copy!' }]}>
                            <Select placeholder={availableNumbersForModal.length > 0 ? "Select book number" : "No copies available"} style={{ width: '100%' }} allowClear showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} disabled={availableNumbersForModal.length === 0}>
                                {availableNumbersForModal.map(num => (<Option key={num.id} value={num.id} label={num.book_number}>{num.book_number}</Option>))}
                            </Select>
                        </Form.Item>

                         {/* Return Date Selection */}
                        <Form.Item label="Set Return Date" name="date_to_be_returned" rules={[{ required: true, message: 'Please set the return date!' }]}>
                             <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current < dayjs().startOf('day')} />
                         </Form.Item>
                    </Form>
                 )}
            </Modal>
            {/* End Approval Modal */}
        </AppLayout>
    );
}

// Assign the Admin layout (Removed breadcrumbs prop)
AdminBorrowRequests.layout = (page: React.ReactElement<AdminBorrowRequestsProps>) => (
    <AppLayout title="Borrow Requests" children={page} />
);
