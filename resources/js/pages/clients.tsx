// File: resources/js/Pages/Admin/Clients.tsx (or wherever your Admin client management page is)

import React, { useState, useEffect } from 'react';
// Ant Design Imports
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Popconfirm,
    Space,
    Alert,
    Row,
    Col,
    Typography,
    Tag // Added Tag for status display
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
    BookOutlined // Icon for books count
} from '@ant-design/icons';
// SweetAlert
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// Layout and Inertia
import AppLayout from '@/layouts/app-layout'; // Assuming this is your Admin Area Layout
import { type BreadcrumbItem, PageProps } from '@/types'; // Assuming shared types
import { Head, usePage } from '@inertiajs/react'; // Import usePage if needed

const MySwal = withReactContent(Swal);

// Declare route helper if not globally typed by Ziggy
declare function route(name: string, params?: any, absolute?: boolean): string;

// Breadcrumbs for the Admin Layout
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'), // Ensure this route name exists for admin/default dashboard
    },
    {
        title: 'Clients',
        // Current page - no href needed
    },
];

// Interface matching the data structure from ClientController@index (including count)
interface Client {
    id: number;
    name: string;
    idNumber: string;
    phoneNumber: string;
    email: string;
    // books array might not be populated in index, count is used instead
    // books: string[] | null;
    status: string;
    borrowed_book_numbers_count: number; // Field added by withCount in backend
}

// Type for the data expected from the Add Client form
interface AddClientFormValues {
    name: string;
    idNumber: string;
    phoneNumber: string;
    email: string;
    // Password is not in the form, added manually before sending
}

export default function Clients() {
    // --- State Variables ---
    const [clients, setClients] = useState<Client[]>([]); // Holds the list of clients
    const [editClientModalOpen, setEditClientModalOpen] = useState(false); // Edit modal visibility
    const [addClientModalOpen, setAddClientModalOpen] = useState(false); // Add modal visibility
    const [editingClient, setEditingClient] = useState<Client | null>(null); // Client being edited
    const [addClientForm] = Form.useForm<AddClientFormValues>(); // Form instance for adding
    const [editClientForm] = Form.useForm<Client>(); // Form instance for editing
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const [searchText, setSearchText] = useState(''); // Search input value
    const [error, setError] = useState<string | null>(null); // Stores API call errors

    // --- Fetch Clients Effect ---
    useEffect(() => {
        fetchClients();
    }, []);

    // --- API Functions ---
    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(route('api.clients.index')); // Use named route
            if (response.ok) {
                const clientsData = await response.json();
                setClients(Array.isArray(clientsData.clients) ? clientsData.clients : []);
            } else {
                const errorData = await response.json();
                const message = errorData.message || 'Failed to fetch clients.';
                MySwal.fire('Error Fetching Data', message, 'error');
                setError(message);
            }
        } catch (err: any) {
            const message = err.message || 'An unexpected error occurred while fetching clients.';
            MySwal.fire('Network Error', message, 'error');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddClient = async () => {
        try {
            const values = await addClientForm.validateFields();
            setLoading(true);
            setError(null);

            // Add the default password before sending
            const valuesWithPassword = {
                ...values,
                password: '0000', // Default password
                // password_confirmation: '0000', // Add if backend requires confirmation
            };

            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.getAttribute('content');
            if (!csrfToken) throw new Error("CSRF token not found");

            const response = await fetch(route('api.clients.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(valuesWithPassword),
            });

            if (response.ok) {
                setAddClientModalOpen(false);
                MySwal.fire('Success', 'Client added successfully!', 'success');
                fetchClients(); // Refresh client list
            } else {
                const errorData = await response.json();
                if (response.status === 422 && errorData.errors) {
                     addClientForm.setFields(Object.entries(errorData.errors).map(([name, errors]) => ({ name, errors: errors as string[] })));
                     setError('Validation failed. Please check the form.');
                } else {
                    const message = errorData.message || 'Failed to add client.';
                    MySwal.fire('Error Adding Client', message, 'error');
                    setError(message);
                }
            }
        } catch (err: any) {
            console.error('Add Client failed:', err);
             if (err.errorFields) setError('Please correct the validation errors.');
             else setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEditClient = async () => {
        try {
            const values = await editClientForm.validateFields();
            if (!editingClient) return;
            setLoading(true);
            setError(null);
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.getAttribute('content');
            if (!csrfToken) throw new Error("CSRF token not found");

            const response = await fetch(route('api.clients.update', { client: editingClient.id }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                     'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(values), // Send only validated fields from edit form
            });

             if (response.ok) {
                setEditClientModalOpen(false);
                MySwal.fire('Success', 'Client updated successfully!', 'success');
                setEditingClient(null);
                fetchClients();
            } else {
                const errorData = await response.json();
                 if (response.status === 422 && errorData.errors) {
                     editClientForm.setFields(Object.entries(errorData.errors).map(([name, errors]) => ({ name, errors: errors as string[] })));
                     setError('Validation failed. Please check the form.');
                 } else {
                    const message = errorData.message || 'Failed to update client.';
                    MySwal.fire('Error Updating Client', message, 'error');
                    setError(message);
                 }
            }
        } catch (err: any) {
            console.error('Update Client failed:', err);
             if (err.errorFields) setError('Please correct the validation errors.');
             else setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (id: number) => {
        // Swal confirmation is handled by Popconfirm, direct delete request here
        try {
            setLoading(true);
            setError(null);
             const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.getAttribute('content');
             if (!csrfToken) throw new Error("CSRF token not found");

            const response = await fetch(route('api.clients.destroy', { client: id }), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                MySwal.fire('Deleted!', 'Client has been deleted.', 'success');
                fetchClients();
            } else {
                const errorData = await response.json();
                const message = errorData.message || 'Failed to delete client.';
                MySwal.fire('Error Deleting Client', message, 'error');
                setError(message);
            }
        } catch (err: any) {
            console.error('Delete failed:', err);
            const message = err.message || 'An unexpected error occurred.';
            MySwal.fire('Error', message, 'error');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Open/Close Handlers ---
    const showAddModal = () => {
        addClientForm.resetFields();
        setAddClientModalOpen(true);
    };

    const showEditModal = (client: Client) => {
        setEditingClient(client);
        const { borrowed_book_numbers_count, ...formData } = client; // Exclude count from form
        editClientForm.setFieldsValue(formData);
        setEditClientModalOpen(true);
    };

    const handleCancelAdd = () => {
        setAddClientModalOpen(false);
    };

     const handleCancelEdit = () => {
        setEditClientModalOpen(false);
        setEditingClient(null); // Clear editing state on cancel
    };

    // --- Filtering Logic ---
    const filteredClients = clients.filter((client) =>
        Object.values(client).some(value =>
            String(value).toLowerCase().includes(searchText.toLowerCase())
        )
    );

    // --- Table Columns Definition ---
    const columns: TableProps<Client>['columns'] = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'ID Number', dataIndex: 'idNumber', key: 'idNumber' },
        { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Books Borrowed',
            dataIndex: 'borrowed_book_numbers_count', // Use the count field
            key: 'borrowed_count',
            align: 'center',
            sorter: (a, b) => a.borrowed_book_numbers_count - b.borrowed_book_numbers_count,
            render: (count: number) => (
                // Display count in "X (X)" format
                <Typography.Text style={{ whiteSpace: 'nowrap' }}>
                     <BookOutlined style={{ marginRight: '4px', color: count > 0 ? '#1890ff' : '#bfbfbf' }} />
                    {`${count} (${count})`}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                 let color = status === 'active' ? 'green' : 'volcano';
                 return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record: Client) => (
                <Space size="small">
                    <Button title={`Edit ${record.name}`} type="text" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
                    <Popconfirm
                        title="Delete Client"
                        description={`Delete ${record.name}?`}
                        onConfirm={() => handleDeleteClient(record.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                        placement="topRight"
                    >
                        <Button title={`Delete ${record.name}`} type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // --- Component Return JSX ---
    return (
        // Assuming AppLayout is the correct layout for this Admin page
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Clients" />
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                 <Row justify="space-between" align="middle" wrap={false}>
                     <Col flex="auto">
                         <Typography.Title level={3} style={{ margin: 0 }}>Client Management</Typography.Title>
                     </Col>
                     <Col flex="none">
                         <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                             Add New Client
                         </Button>
                     </Col>
                 </Row>

                 <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search Clients..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                 />

                {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }}/>}

                <Table
                    dataSource={filteredClients}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 'max-content' }} // Enable horizontal scroll on smaller screens
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} // Add pagination options
                />
            </Space>

            {/* --- Modals --- */}
            {/* Add Client Modal */}
            <Modal
                title="Add New Client"
                open={addClientModalOpen}
                onCancel={handleCancelAdd}
                confirmLoading={loading}
                onOk={() => addClientForm.submit()} // Trigger form validation & onFinish
                okText="Save Client"
                destroyOnClose // Reset form when closed
                maskClosable={false} // Prevent closing on overlay click
            >
                {/* onFinish calls handleSaveAddClient after validation */}
                <Form form={addClientForm} layout="vertical" name="add_client_form" onFinish={handleSaveAddClient}>
                    <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Client name is required' }]}>
                        <Input placeholder="Enter full name" />
                    </Form.Item>
                    <Form.Item label="ID Number" name="idNumber" rules={[{ required: true, message: 'Client ID number is required' }]}>
                        <Input placeholder="Enter ID number" />
                    </Form.Item>
                    <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true, message: 'Client phone number is required' }]}>
                        <Input placeholder="Enter phone number (e.g., +254...)" />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                        <Input placeholder="Enter email address" />
                    </Form.Item>
                    {/* Password field is NOT needed here - it defaults to '0000' on submit */}
                     <Alert message="Password will be set to '0000'. Client should change it upon first login or via password reset." type="info" showIcon style={{marginTop: "10px"}}/>
                </Form>
            </Modal>

            {/* Edit Client Modal */}
            <Modal
                title={`Edit Client: ${editingClient?.name || ''}`}
                open={editClientModalOpen}
                onCancel={handleCancelEdit}
                confirmLoading={loading}
                onOk={() => editClientForm.submit()} // Trigger form validation & onFinish
                okText="Save Changes"
                destroyOnClose
                maskClosable={false}
            >
                 {/* onFinish calls handleSaveEditClient after validation */}
                <Form form={editClientForm} layout="vertical" name="edit_client_form" onFinish={handleSaveEditClient}>
                    <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Client name is required' }]}>
                        <Input placeholder="Enter full name" />
                    </Form.Item>
                    <Form.Item label="ID Number" name="idNumber" rules={[{ required: true, message: 'Client ID number is required' }]}>
                        <Input placeholder="Enter ID number" />
                    </Form.Item>
                    <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true, message: 'Client phone number is required' }]}>
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                        <Input placeholder="Enter email address" />
                    </Form.Item>
                     {/* Password is not edited here - handled via reset */}
                     <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Status is required'}]}>
                        <Input placeholder="e.g., active, inactive"/>
                        {/* Consider using a Select component for predefined statuses */}
                     </Form.Item>
                </Form>
            </Modal>
        </AppLayout>
    );
}
