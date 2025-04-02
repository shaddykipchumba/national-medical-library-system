import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Form, DatePicker } from 'antd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import moment, { Moment } from 'moment'; // Import Moment

const MySwal = withReactContent(Swal);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Checkout', href: '/checkout' },
];

interface Client {
    id: number;
    name: string;
    books: string[];
}

interface Book {
    id: number;
    title: string;
}

interface BookNumber {
    id: number;
    book_number: string;
}

const Checkout = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [bookNumbers, setBookNumbers] = useState<BookNumber[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedBookNumber, setSelectedBookNumber] = useState<BookNumber | null>(null);
    const [returnDate, setReturnDate] = useState<Moment | null>(null); // Use Moment type
    const [form] = Form.useForm();
    const BOOK_LIMIT = 5;

    useEffect(() => {
        fetchClients();
        fetchBooks();
    }, []);

    useEffect(() => {
        if (selectedBook) {
            fetchAvailableBookNumbers(selectedBook.id);
        } else {
            setBookNumbers([]);
        }
    }, [selectedBook]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (response.ok) {
                const clientsData = await response.json();
                setClients(clientsData.clients);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            MySwal.fire('Error', 'Failed to fetch clients. Please check your network connection.', 'error'); // Show error to user
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await fetch('/api/books');
            if (response.ok) {
                const booksData = await response.json();
                setBooks(booksData.books);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            MySwal.fire('Error', 'Failed to fetch books. Please check your network connection.', 'error'); // Show error
        }
    };

    const fetchAvailableBookNumbers = async (bookId: number) => {
        try {
            const response = await fetch(`/api/book-numbers?book_id=${bookId}&status=available`);
            if (response.ok) {
                const bookNumbersData = await response.json();
                setBookNumbers(bookNumbersData.book_numbers);
            }
        } catch (error) {
            console.error('Error fetching available book numbers:', error);
             MySwal.fire('Error', 'Failed to fetch book numbers. Please check your network connection.', 'error'); // Show error
        }
    };

    const handleClientChange = (clientId: number) => {
        const client = clients.find((c) => c.id === clientId);
        setSelectedClient(client || null);
        setSelectedBook(null);
        setSelectedBookNumber(null);
        setReturnDate(null);
        setBookNumbers([]);
        form.setFieldsValue({ book: undefined, bookNumber: undefined, returnDate: undefined }); // Clear form fields
    };

    const handleBookChange = (bookId: number) => {
        const book = books.find((b) => b.id === bookId);
        setSelectedBook(book || null);
        setSelectedBookNumber(null);
        setReturnDate(null);
        form.setFieldsValue({ bookNumber: undefined, returnDate: undefined });  // Clear form
    };

    const handleBookNumberChange = (bookNumberId: number) => {
        const bookNumber = bookNumbers.find((bn) => bn.id === bookNumberId);
        setSelectedBookNumber(bookNumber || null);
    };

    const handleReturnDateChange = (date: Moment | null) => { // Use Moment
        setReturnDate(date);
    };

    const handleCheckout = async () => {
        if (!selectedClient || !selectedBook || !selectedBookNumber || !returnDate) {
            Swal.fire('Error', 'Please select a client, book, book number, and return date.', 'error');
            return;
        }

        if (selectedClient.books && selectedClient.books.length >= BOOK_LIMIT) {
            Swal.fire('Error', `Client has reached the maximum book limit of ${BOOK_LIMIT}.`, 'error');
            return;
        }

        const bookIdentifier = `${selectedBook.title} - ${selectedBookNumber.book_number}`;

        if (selectedClient.books && selectedClient.books.includes(bookIdentifier)) {
            Swal.fire('Error', 'This book is already assigned to the client.', 'error');
            return;
        }

        const result = await MySwal.fire({
            title: 'Confirm Checkout',
            text: `Assign book "${selectedBook.title}" (number: ${selectedBookNumber.book_number}) to ${selectedClient.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Assign it!',
            cancelButtonText: 'No, Cancel',
        });

        if (result.isConfirmed) {
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')!.getAttribute('content');
                // Update client's assigned books list
                const clientResponse = await fetch(`/api/clients/${selectedClient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        books: [...(selectedClient.books || []), bookIdentifier],
                    }),
                });

                if (clientResponse.ok) {
                    // Update book number: mark as assigned, set return date, and assign client id
                    const bookNumberResponse = await fetch(`/api/book-numbers/${selectedBookNumber.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        body: JSON.stringify({
                            status: 'assigned',
                            date_to_be_returned: returnDate.format('YYYY-MM-DD'),
                            assigned_to: selectedClient.id,
                        }),
                    });

                    if (bookNumberResponse.ok) {
                        Swal.fire('Success', 'Book assigned successfully!', 'success');
                        setSelectedClient(null);
                        setSelectedBook(null);
                        setSelectedBookNumber(null);
                        setReturnDate(null);
                        form.resetFields();
                        fetchClients(); // Refresh client list
                        if (selectedBook) {
                            fetchAvailableBookNumbers(selectedBook.id); //refresh
                        }
                    } else {
                        const errorData = await bookNumberResponse.json(); //attempt to get error message.
                        Swal.fire('Error',  errorData.message || 'Failed to update the book number.', 'error');
                    }
                } else {
                    const errorData = await clientResponse.json();
                    Swal.fire('Error', errorData.message || 'Failed to update the client.', 'error');
                }
            } catch (error: any) {
                console.error('Error assigning book:', error);
                Swal.fire('Error', error.message || 'An error occurred while assigning the book.', 'error');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Checkout" />
            <div className="flex justify-center items-center h-full p-4">
                <Card title="Book Checkout" className="w-full max-w-md">
                    <Form form={form} layout="vertical">
                        <Form.Item label="Client">
                            <Select
                                showSearch
                                placeholder="Select a client"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children as React.ReactNode).toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                onChange={handleClientChange}
                                value={selectedClient?.id}
                                options={clients.map((client) => ({ value: client.id, label: client.name }))}
                                name="client" // Added name for form
                            />
                        </Form.Item>

                        <Form.Item label="Book Title">
                            <Select
                                showSearch
                                placeholder="Select a book title"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children as React.ReactNode).toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                onChange={handleBookChange}
                                value={selectedBook?.id}
                                options={books.map((book) => ({ value: book.id, label: book.title }))}
                                disabled={!selectedClient}
                                name="book" // Added name
                            />
                        </Form.Item>

                        <Form.Item label="Book Number">
                            <Select
                                showSearch
                                placeholder="Select a book number"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children as React.ReactNode).toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                onChange={handleBookNumberChange}
                                value={selectedBookNumber?.id}
                                options={bookNumbers.map((bookNumber) => ({ value: bookNumber.id, label: bookNumber.book_number }))}
                                disabled={!selectedBook}
                                name="bookNumber" // Added name
                            />
                        </Form.Item>

                        <Form.Item label="Return Date">
                            <DatePicker
                                onChange={handleReturnDateChange}
                                value={returnDate}
                                disabled={!selectedBookNumber}
                                style={{ width: '100%' }} // Added inline style
                                name="returnDate"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                onClick={handleCheckout}
                                disabled={!selectedClient || !selectedBook || !selectedBookNumber || !returnDate}
                            >
                                Checkout
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Checkout;
