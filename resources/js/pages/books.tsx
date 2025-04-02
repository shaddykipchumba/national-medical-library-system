import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Input, Form, Popconfirm, Space, Progress } from 'antd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const MySwal = withReactContent(Swal);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Books', href: '/books' },
];

interface Book {
    id: number;
    title: string;
    author: string;
    year: number;
    created_at?: string;
    updated_at?: string;
    bookNumberCount?: number;
}

const Books = () => {
    const [data, setData] = useState<Book[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isAddingBookNumbers, setIsAddingBookNumbers] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/books');
            if (response.ok) {
                const booksData = await response.json();
                const books = booksData.books;
                const booksWithCount = await Promise.all(
                    books.map(async (book: Book) => {
                        const bookNumbersResponse = await fetch(`/api/book-numbers?book_id=${book.id}`);
                        if (bookNumbersResponse.ok) {
                            const bookNumbersData = await bookNumbersResponse.json();
                            return { ...book, bookNumberCount: bookNumbersData.book_numbers.length };
                        } else {
                            return { ...book, bookNumberCount: 0 };
                        }
                    })
                );
                setData(booksWithCount);
            } else {
                MySwal.fire('Error', 'Failed to fetch books from the server.', 'error');
            }
        } catch (error: any) {
            MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
        setProgress(0);
        setIsAddingBookNumbers(false);
    };

    const handleSaveBook = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                const bookData = await response.json();
                await addBookNumbers(
                    bookData.book.id,
                    values.totalBooks,
                    values.startingWord,
                    values.endingWord
                );
                MySwal.fire('Success', 'Book added successfully!', 'success');
                fetchBooks();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to add book.', 'error');
            }
        } catch (error: any) {
            MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addBookNumbers = async (
        bookId: number,
        totalBooks: number,
        startingWord: string,
        endingWord: string
    ) => {
        setIsAddingBookNumbers(true);
        const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
        for (let i = 1; i <= totalBooks; i++) {
            try {
                const response = await fetch('/api/book-numbers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        book_id: bookId,
                        book_number: `${startingWord.substring(0, 20)}${i}${endingWord.substring(0, 20)}`, // Fix: Removed HTML, limited length
                        status: 'available',
                        assigned_to: null,
                        date_to_be_returned: null,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json(); //attempt to get error message.
                    console.error(`Failed to add book number ${i}:`, errorData);
                    MySwal.fire('Error', `Failed to add book number ${i}.  Check console for details.`, 'error')
                }
                setProgress((i / totalBooks) * 100);
            } catch (error) {
                console.error('Error adding book number:', error);
                MySwal.fire('Error', `Error adding book number ${i}.  Check console for details.`, 'error')

            }
        }
        setIsAddingBookNumbers(false);
        setProgress(0);
    };

    const handleEdit = (record: Book) => {
        setEditingBook(record);
        form.setFieldsValue(record);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditingBook(null);
        form.resetFields();
    };

    const handleSaveEdit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch(`/api/books/${editingBook!.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                MySwal.fire('Success', 'Book updated successfully!', 'success');
                fetchBooks();
                handleCloseEditModal();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to update book.', 'error');
            }
        } catch (error: any) {
            MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                MySwal.fire('Success', 'Book deleted successfully!', 'success');
                fetchBooks();
            } else {
                const errorData = await response.json();
                MySwal.fire('Error', errorData.message || 'Failed to delete book.', 'error');
            }
        } catch (error: any) {
            MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Book) => (
                <Link href={`/books/${record.id}`}>{text}</Link>
            ),
        },
        {
            title: 'Author',
            dataIndex: 'author',
            key: 'author',
        },
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            sorter: (a, b) => a.year - b.year,
            sortDirections: ['ascend', 'descend'],
        },
        {
            title: 'Total Books',
            dataIndex: 'bookNumberCount',
            key: 'bookNumberCount',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Book) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this book?"
                        onConfirm={() => handleDelete(record.id)}
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
            <Head title="Books" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Books</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal} loading={loading}>
                        Add Book
                    </Button>
                </div>

                <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

                <Modal
                    title="Add New Book"
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={[
                        <Button key="cancel" onClick={handleCloseModal} disabled={loading || isAddingBookNumbers}>
                            Cancel
                        </Button>,
                        <Button key="save" type="primary" onClick={handleSaveBook} loading={loading || isAddingBookNumbers}>
                            Save
                        </Button>,
                    ]}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item label="Book Title" name="title" rules={[{ required: true, message: 'Please enter book title' }]}>
                            <Input placeholder="Enter book title" />
                        </Form.Item>
                        <Form.Item label="Author" name="author" rules={[{ required: true, message: 'Please enter author name' }]}>
                            <Input placeholder="Enter author name" />
                        </Form.Item>
                        <Form.Item label="Year" name="year" rules={[{ required: true, message: 'Please enter publication year' }]}>
                            <Input type="number" placeholder="Enter publication year" />
                        </Form.Item>
                        <Form.Item label="Total Books" name="totalBooks" rules={[{ required: true, message: 'Please enter total number of books' }]}>
                            <Input type="number" placeholder="Enter total number of books" />
                        </Form.Item>
                        <Form.Item
                            label="Starting Word"
                            name="startingWord"
                            rules={[
                                { required: true, message: 'Please enter starting word' },
                                { max: 20, message: 'Starting word cannot be longer than 20 characters' },
                            ]}
                        >
                            <Input placeholder="Enter starting word" maxLength={20} />
                        </Form.Item>
                        <Form.Item
                            label="Ending Word"
                            name="endingWord"
                            rules={[
                                { required: true, message: 'Please enter ending word' },
                                { max: 20, message: 'Ending word cannot be longer than 20 characters' },
                            ]}
                        >
                            <Input placeholder="Enter ending word" maxLength={20} />
                        </Form.Item>
                    </Form>
                    {isAddingBookNumbers && <Progress percent={progress} />}
                </Modal>

                <Modal
                    title="Edit Book"
                    open={editModalOpen}
                    onCancel={handleCloseEditModal}
                    footer={[
                        <Button key="cancel" onClick={handleCloseEditModal} disabled={loading}>
                            Cancel
                        </Button>,
                        <Button key="save" type="primary" onClick={handleSaveEdit} loading={loading}>
                            Save</Button>,
                    ]}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item label="Book Title" name="title" rules={[{ required: true, message: 'Please enter book title' }]}>
                            <Input placeholder="Enter book title" />
                        </Form.Item>
                        <Form.Item label="Author" name="author" rules={[{ required: true, message: 'Please enter author name' }]}>
                            <Input placeholder="Enter author name" />
                        </Form.Item>
                        <Form.Item label="Year" name="year" rules={[{ required: true, message: 'Please enter publication year' }]}>
                            <Input type="number" placeholder="Enter publication year" />
                        </Form.Item>
                        <Form.Item label="Total Books" name="totalBooks" rules={[{ required: true, message: 'Please enter total number of books' }]}>
                            <Input type="number" placeholder="Enter total number of books" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AppLayout>
    );
};

export default Books;
