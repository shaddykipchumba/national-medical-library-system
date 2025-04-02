import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Input, Form, Popconfirm, Space } from 'antd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const MySwal = withReactContent(Swal);

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Books', href: '/books' },
  { title: 'Book Details', href: '' },
];

interface BookNumber {
  id: number;
  book_id: number;
  book_number: string;
  status: 'available' | 'assigned';
  assigned_to: number | null;
  date_to_be_returned: string | null;
  created_at?: string;
  updated_at?: string;
}

const BookDetails = () => {
  const { props } = usePage();
  const { id, book, bookNumbers } = props;

  const [data, setData] = useState<BookNumber[]>(bookNumbers);
  const [bookTitle, setBookTitle] = useState<string>(book.title);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBookNumber, setEditingBookNumber] = useState<BookNumber | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setData(bookNumbers.filter(bn => bn.book_number.includes(searchText)));
  }, [searchText, bookNumbers]);

  useEffect(() => {
    breadcrumbs[2].title = bookTitle;
  }, [bookTitle]);

  const handleEdit = (record: BookNumber) => {
    setEditingBookNumber(record);
    form.setFieldsValue({ book_number: record.book_number });
    setEditModalOpen(true);
  };

  const handleDelete = async (record: BookNumber) => {
    try {
      setLoading(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
      const response = await fetch(`/api/book-numbers/${record.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
        },
      });
      if (response.ok) {
        MySwal.fire('Success', 'Book number deleted successfully!', 'success');
        // Filter out the deleted book number from the state.
        setData(data.filter(item => item.id !== record.id));
      } else {
        const errorData = await response.json();
        MySwal.fire('Error', errorData.message || 'Failed to delete book number.', 'error');
      }
    } catch (error: any) {
      MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingBookNumber(null);
    form.resetFields();
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
      const response = await fetch(`/api/book-numbers/${editingBookNumber!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        MySwal.fire('Success', 'Book number updated successfully!', 'success');
        // Update the state with the edited book number.
        setData(data.map(item => item.id === editingBookNumber!.id ? { ...item, ...values } : item));
        handleCloseEditModal();
      } else {
        const errorData = await response.json();
        MySwal.fire('Error', errorData.message || 'Failed to update book number.', 'error');
      }
    } catch (error: any) {
      MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Book Number',
      dataIndex: 'book_number',
      key: 'book_number',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BookNumber) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this book number?"
            onConfirm={() => handleDelete(record)}
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
      <Head title={`${bookTitle} Details`} />
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">{bookTitle} Details</h1>
        <Input
          placeholder="Search book numbers..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

        {/* Edit Book Number Modal */}
        <Modal
          title="Edit Book Number"
          open={editModalOpen}
          onCancel={handleCloseEditModal}
          footer={[
            <Button key="cancel" onClick={handleCloseEditModal} disabled={loading}>
              Cancel
            </Button>,
            <Button key="save" type="primary" onClick={handleSaveEdit} loading={loading}>
              Save
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Book Number"
              name="book_number"
              rules={[{ required: true, message: 'Please enter book number' }]}
            >
              <Input placeholder="Enter book number" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default BookDetails;