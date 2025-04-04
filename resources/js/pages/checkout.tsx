// File: resources/js/Pages/Checkout.tsx (or similar path for Admin checkout)

import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Form, DatePicker, Alert } from 'antd'; // Added Alert
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout'; // Assuming Admin Layout
import { type BreadcrumbItem, PageProps } from '@/types'; // Import PageProps
import { Head, usePage } from '@inertiajs/react'; // Import usePage
import moment, { Moment } from 'moment'; // Use Moment.js (or Day.js if preferred)

const MySwal = withReactContent(Swal);

// Declare route if needed
declare function route(name: string, params?: any, absolute?: boolean): string;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') }, // Use route helper
    { title: 'Checkout', href: route('checkout') }, // Use route helper
];

interface Client { id: number; name: string; /* books array is likely not needed here */ }
interface Book { id: number; title: string; }
interface BookNumber { id: number; book_number: string; }

// Define Props if any are passed via Inertia (likely none for this page)
interface CheckoutProps extends PageProps {}

export default function Checkout(props: CheckoutProps) { // Add props if needed
    const [clients, setClients] = useState<Client[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [bookNumbers, setBookNumbers] = useState<BookNumber[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
    const [selectedBookId, setSelectedBookId] = useState<number | undefined>(undefined);
    const [selectedBookNumberId, setSelectedBookNumberId] = useState<number | undefined>(undefined);
    const [returnDate, setReturnDate] = useState<Moment | null>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const [error, setError] = useState<string | null>(null); // Error display state
    // const BOOK_LIMIT = 5; // Limit check should happen in backend during assignment

    useEffect(() => { fetchClients(); fetchBooks(); }, []);

    useEffect(() => {
        // Fetch available numbers when a book is selected
        if (selectedBookId) {
            fetchAvailableBookNumbers(selectedBookId);
        } else {
            setBookNumbers([]); // Clear numbers if no book selected
        }
    }, [selectedBookId]);

    // --- Fetching Functions (with basic error handling) ---
    const fetchClients = async () => {
        // Simplified - Add loading/error handling as needed
        try {
            const response = await fetch(route('api.clients.index')); // Use named route
            const data = await response.json();
            setClients(data.clients || []);
        } catch (e) { console.error("Fetch clients error:", e); setError("Could not load clients."); }
    };
    const fetchBooks = async () => {
        // Simplified - Add loading/error handling as needed
         try {
            const response = await fetch(route('api.books.index')); // Use named route
            const data = await response.json();
            setBooks(data.books || []);
         } catch (e) { console.error("Fetch books error:", e); setError("Could not load books."); }
    };
    const fetchAvailableBookNumbers = async (bookId: number) => {
         // Simplified - Add loading/error handling as needed
        try {
            // Call API endpoint that specifically gets available numbers for a book
            // Assuming a route like 'api.books.available-numbers' exists
             const response = await fetch(route('api.books.available-numbers', { book: bookId })); // Use named route
             const data = await response.json();
             setBookNumbers(data.available_numbers || []);
        } catch (e) { console.error("Fetch book numbers error:", e); setError("Could not load book copies."); setBookNumbers([]); }
    };

    // --- Form Change Handlers ---
    const handleClientChange = (value: number) => { setSelectedClientId(value); form.resetFields(['book', 'bookNumber', 'returnDate']); setSelectedBookId(undefined); setSelectedBookNumberId(undefined); setReturnDate(null); };
    const handleBookChange = (value: number) => { setSelectedBookId(value); form.resetFields(['bookNumber', 'returnDate']); setSelectedBookNumberId(undefined); setReturnDate(null); };
    const handleBookNumberChange = (value: number) => { setSelectedBookNumberId(value); };
    const handleReturnDateChange = (date: Moment | null, dateString: string) => { setReturnDate(date); }; // Correct signature for DatePicker

    // --- Checkout Logic ---
    const handleCheckout = async () => {
        // Basic frontend validation
        if (!selectedClientId || !selectedBookId || !selectedBookNumberId || !returnDate) {
            MySwal.fire('Missing Information', 'Please select a client, book, book number, and return date.', 'warning');
            return;
        }

        // Get selected item details for confirmation message (optional)
        const clientName = clients.find(c => c.id === selectedClientId)?.name;
        const bookTitle = books.find(b => b.id === selectedBookId)?.title;
        const bookNumber = bookNumbers.find(bn => bn.id === selectedBookNumberId)?.book_number;

        // Confirmation Dialog
        const result = await MySwal.fire({
            title: 'Confirm Checkout',
            // PROBLEM: Comma inside the backticks ``
            html: `Assign book "<b>${bookTitle || 'Unknown'}</b>" (Copy: <b>${bookNumber || 'Unknown'}</b>) to <b>${clientName || 'Unknown'}</b>?<br/>Return date: <b>${returnDate.format('DD MMM YYYY')}</b>,`, // <--- COMMA HERE IS WRONG
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Assign Book',
            cancelButtonText: 'No, Cancel',
        });

        if (result.isConfirmed) {
            setLoading(true);
            setError(null);
            try {
                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.getAttribute('content');
                if (!csrfToken) throw new Error("CSRF token not found");

                // ** CORRECTED API CALL: Use the 'assign' route **
                const response = await fetch(route('api.book-numbers.assign', { bookNumber: selectedBookNumberId }), {
                    method: 'PUT', // Method for the assign route
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        // Body should match what BookNumberController@assign expects
                        assigned_to: selectedClientId,
                        date_to_be_returned: returnDate.format('YYYY-MM-DD'), // Format date correctly
                    }),
                });
                // ** END CORRECTION **

                const responseData = await response.json(); // Try parsing JSON regardless of status

                if (response.ok) {
                    MySwal.fire('Success!', responseData.message || 'Book assigned successfully!', 'success');
                    // Reset form and state
                    form.resetFields();
                    setSelectedClientId(undefined);
                    setSelectedBookId(undefined);
                    setSelectedBookNumberId(undefined);
                    setReturnDate(null);
                    setBookNumbers([]); // Clear book numbers as selection is reset
                    // Optionally refetch clients if their borrowed count might be displayed elsewhere
                    // fetchClients();
                } else {
                     // Handle specific errors (like limit reached, book not available) or generic errors
                     MySwal.fire(
                        'Assignment Failed',
                        // Use backticks ` ` for the fallback string to allow interpolation
                        responseData.message || `Failed to assign book (Status: ${response.status})`,
                        'error'
                    );
                     setError(responseData.message || 'Assignment failed.');
                      // Potentially refresh available numbers if failure was due to availability change
                      if (selectedBookId) fetchAvailableBookNumbers(selectedBookId);
                }

            } catch (error: any) {
                console.error('Error assigning book:', error);
                 const message = error.message || 'An error occurred while assigning the book.';
                 MySwal.fire('Error', message, 'error');
                 setError(message);
            } finally {
                 setLoading(false);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Book Checkout" />
            <div style={{ maxWidth: '600px', margin: 'auto' }}> {/* Center card */}
                <Card title="Book Checkout Process">
                    {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
                    <Form form={form} layout="vertical" onFinish={handleCheckout}> {/* Add onFinish */}
                        <Form.Item name="client" label="Select Client" rules={[{ required: true, message: 'Please select a client!' }]}>
                            <Select
                                showSearch
                                placeholder="Search or Select a client"
                                optionFilterProp="label" // Search by label (client name)
                                onChange={handleClientChange}
                                value={selectedClientId}
                                loading={!clients.length} // Show loading if clients aren't loaded
                                options={clients.map((client) => ({ value: client.id, label: client.name }))}
                                filterOption={(input, option) => // Custom filter function
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                  }
                            />
                        </Form.Item>

                        <Form.Item name="book" label="Select Book Title" rules={[{ required: true, message: 'Please select a book!' }]}>
                            <Select
                                showSearch
                                placeholder="Search or Select a book title"
                                optionFilterProp="label"
                                onChange={handleBookChange}
                                value={selectedBookId}
                                disabled={!selectedClientId || !books.length} // Disable if no client or books loaded
                                loading={!books.length && !!selectedClientId} // Loading while books fetch
                                options={books.map((book) => ({ value: book.id, label: book.title }))}
                                 filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                  }
                            />
                        </Form.Item>

                        <Form.Item name="bookNumber" label="Select Available Book Number" rules={[{ required: true, message: 'Please select a book number!' }]}>
                            <Select
                                showSearch
                                placeholder="Select an available book number"
                                optionFilterProp="label"
                                onChange={handleBookNumberChange}
                                value={selectedBookNumberId}
                                disabled={!selectedBookId || bookNumbers.length === 0} // Disable if no book or numbers
                                loading={!!selectedBookId && !bookNumbers.length} // Loading while numbers fetch
                                options={bookNumbers.map((bn) => ({ value: bn.id, label: bn.book_number }))}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                  }
                                notFoundContent={selectedBookId ? "No available copies found" : "Select a book first"} // Contextual message
                            />
                        </Form.Item>

                        <Form.Item name="returnDate" label="Return Date" rules={[{ required: true, message: 'Please select a return date!' }]}>
                            <DatePicker
                                onChange={handleReturnDateChange} // Use correct onChange signature
                                value={returnDate}
                                disabled={!selectedBookNumberId}
                                style={{ width: '100%' }}
                                format="YYYY-MM-DD" // Specify format
                                disabledDate={(current) => {
                                    // Can not select days before today
                                    return current && current < moment().endOf('day');
                                }}
                            />
                        </Form.Item>

                        <Form.Item>
                            {/* Button is now triggered by Form's onFinish, but we keep onClick for direct click handling logic */}
                            <Button
                                type="primary"
                                onClick={handleCheckout} // Keep direct handler for checks before form submit (or move checks here)
                                // htmlType="submit" // Alternative: Let Form onFinish handle it after validation
                                loading={loading}
                                disabled={!selectedClientId || !selectedBookId || !selectedBookNumberId || !returnDate}
                                block // Make button full width
                            >
                                Assign Book to Client
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </AppLayout>
    );
};

// export default Checkout; // Export was missing in provided code
