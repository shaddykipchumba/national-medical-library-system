import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const MySwal = withReactContent(Swal);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
];

interface Client {
    id: number;
    name: string;
    idNumber: string;
    phoneNumber: string;
    email: string;
    books: string[];
    status: string;
}

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [editClientModalOpen, setEditClientModalOpen] = useState(false);
    const [addClientModalOpen, setAddClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [addClientForm] = Form.useForm();
    const [editClientForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/clients');
            if (response.ok) {
                const clientsData = await response.json();
                setClients(clientsData.clients);
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to fetch clients from the server.', 'error');
                setError(errorData.message || 'Failed to fetch clients');
            }
        } catch (error: any) {
            MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
            setError(error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = () => {
        setAddClientModalOpen(true);
        addClientForm.resetFields();
    };

    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        editClientForm.setFieldsValue(client);
        setEditClientModalOpen(true);
    };

    const handleSaveAddClient = async () => {
        try {
            const values = await addClientForm.validateFields();
            setLoading(true);
            setError(null);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                setAddClientModalOpen(false);
                Swal.fire('Success', 'Client added successfully!', 'success');
                addClientForm.resetFields();
                fetchClients();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to add client.', 'error');
                setError(errorData.message || 'Failed to add client.');
            }
        } catch (error: any) {
            console.error('Validation failed:', error);
            setError(error.message || 'Validation failed.');

        } finally {
            setLoading(false);
        }
    };

    const handleSaveEditClient = async () => {
        try {
            const values = await editClientForm.validateFields();
            setLoading(true);
            setError(null);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch(`/api/clients/${editingClient!.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                setEditClientModalOpen(false);
                Swal.fire('Success', 'Client updated successfully!', 'success');
                fetchClients();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to update client.', 'error');
                setError(errorData.message || 'Failed to update client.');
            }
        } catch (error: any) {
             console.error('Validation failed:', error);
             setError(error.message || 'Validation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                Swal.fire('Success', 'Client deleted successfully!', 'success');
                fetchClients();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to delete client.', 'error');
                setError(errorData.message || 'Failed to delete client.');
            }
        } catch (error: any) {
             console.error('Delete failed:', error);
             setError(error.message || 'Failed to delete client.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'ID Number', dataIndex: 'idNumber', key: 'idNumber' },
        { title: 'Phone Number', dataIndex: 'phoneNumber', key: 'phoneNumber' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Books',
            key: 'books',
            render: (_, record) => (
                <ol>
                    {record.books && Array.isArray(record.books) ? (
                        record.books.map((book: string, index:number) => (
                            <li key={index}>{book}</li>
                        ))
                    ) : (
                        <li>No books assigned.</li>
                    )}
                </ol>
            ),
        },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record: Client) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditClient(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this client?"
                        onConfirm={() => handleDeleteClient(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="danger" icon={<DeleteOutlined />} size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Clients</h1>
                    <Button type="primary" onClick={handleAddClient} loading={loading}>
                        Add Client
                    </Button>
                </div>
                <Input
                    placeholder="Search clients"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                {error && <p className="text-red-500">{error}</p>}
                <Table dataSource={filteredClients} columns={columns} loading={loading} />

                {/* Add Client Modal */}
                <Modal
                    title="Add Client"
                    open={addClientModalOpen}
                    onCancel={() => setAddClientModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setAddClientModalOpen(false)} disabled={loading}>
                            Cancel
                        </Button>,
                        <Button key="save" type="primary" onClick={handleSaveAddClient} loading={loading}>
                            Confirm
                        </Button>,
                    ]}
                >
                    <Form form={addClientForm} layout="vertical">
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'Please enter name' }]}
                        >
                            <Input placeholder="Enter name" />
                        </Form.Item>
                        <Form.Item
                            label="ID Number"
                            name="idNumber"
                            rules={[{ required: true, message: 'Please enter ID number' }]}
                        >
                            <Input placeholder="Enter ID number" />
                        </Form.Item>
                        <Form.Item
                            label="Phone Number"
                            name="phoneNumber"
                            rules={[{ required: true, message: 'Please enter phone number' }]}
                        >
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Please enter email' }]}
                        >
                            <Input placeholder="Enter email" />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Edit Client Modal */}
                <Modal
                    title="Edit Client"
                    open={editClientModalOpen}
                    onCancel={() => setEditClientModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setEditClientModalOpen(false)} disabled={loading}>
                            Cancel
                        </Button>,
                        <Button key="save" type="primary" onClick={handleSaveEditClient} loading={loading}>
                            Save
                        </Button>,
                    ]}
                >
                    <Form form={editClientForm} layout="vertical">
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'Please enter name' }]}
                        >
                            <Input placeholder="Enter name" />
                        </Form.Item>
                        <Form.Item
                            label="ID Number"
                            name="idNumber"
                            rules={[{ required: true, message: 'Please enter ID number' }]}
                        >
                            <Input placeholder="Enter ID number" />
                        </Form.Item>
                        <Form.Item
                            label="Phone Number"
                            name="phoneNumber"
                            rules={[{ required: true, message: 'Please enter phone number' }]}
                        >
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Please enter email' }]}
                        >
                            <Input placeholder="Enter email" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AppLayout>
    );
}

