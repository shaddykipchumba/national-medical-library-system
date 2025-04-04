// File: resources/js/Pages/Checkin.tsx

import React, { useState, useEffect } from 'react';
// Ant Design Imports
import { Card, Select, Button, Form, Spin, Alert, Typography } from 'antd';
// SweetAlert
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// Layout & Inertia
import AppLayout from '@/layouts/app-layout'; // Assuming Admin Layout
import { type BreadcrumbItem, PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
// Date handling (Using Dayjs is recommended with antd v4/v5)
import dayjs, { Dayjs } from 'dayjs';

const MySwal = withReactContent(Swal);
const { Option } = Select;

// Declare route function if needed globally
declare function route(name: string, params?: any, absolute?: boolean): string;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Checkin' },
];

// Interface for Client data fetched from API
interface Client {
    id: number;
    name: string;
    // IMPORTANT: Assuming 'books' contains identifiers like "Title - BookNumber"
    // This requires backend API for check-in to parse this string or
    // ideally, backend API for clients should return structured book number data.
    books: string[] | null;
}

// Interface for Book and BookNumber data (only used if checkin logic changes)
// interface Book { id: number; title: string; }
// interface BookNumber { id: number; book_number: string; }

// Props for the component
interface CheckinProps extends PageProps {}

// --- Component Definition ---
// Default export is attached directly to the function
export default function Checkin(props: CheckinProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    // State holds the selected book identifier string (e.g., "Title - Number")
    const [selectedBookIdentifier, setSelectedBookIdentifier] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false); // Loading state for check-in action
    const [fetchLoading, setFetchLoading] = useState<boolean>(false); // Loading state for initial client fetch
    const [error, setError] = useState<string | null>(null);
    const [form] = Form.useForm(); // Ant Design form instance

    // Fetch clients on component mount
    useEffect(() => {
        fetchClients();
    }, []);

    // Fetch client list from API
    const fetchClients = async () => {
        setFetchLoading(true);
        setError(null);
        try {
            const response = await fetch(route('api.clients.index'));
            if (response.ok) {
                const clientsData = await response.json();
                setClients(clientsData.clients || []);
            } else {
                const errorData = await response.json();
                const message = `Failed to load clients: ${errorData.message || response.statusText}`;
                Swal.fire('Error', message, 'error'); setError(message);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
            const message = `An unexpected error occurred while fetching clients: ${ (err as Error).message }`;
            Swal.fire('Error', message, 'error'); setError(message);
        } finally {
            setFetchLoading(false);
        }
    };

    // Update state when client selection changes
    const handleClientChange = (clientId: number) => {
        const client = clients.find((c) => c.id === clientId);
        setSelectedClient(client || null);
        setSelectedBookIdentifier(undefined); // Reset book selection
        form.setFieldsValue({ bookIdentifier: undefined }); // Reset form field
    };

    // Update state when book identifier selection changes
    const handleBookChange = (bookIdentifier: string) => {
        setSelectedBookIdentifier(bookIdentifier);
    };

    // --- Checkin Logic ---
    // This function attempts check-in using the 'collect' API endpoint
    const handleCheckin = async () => {
        if (!selectedClient || !selectedBookIdentifier) {
            Swal.fire('Error', 'Please select a client and a book to check-in.', 'error');
            return;
        }

        // Attempt to extract book number string (assumes "Title - Number" format)
        // WARNING: This is fragile and depends on the exact format in client.books array
        const parts = selectedBookIdentifier.split(' - ');
        const bookNumberStr = parts.length > 1 ? parts[parts.length - 1].trim() : null;

        if (!bookNumberStr) {
             Swal.fire('Error', `Could not determine the Book Number from "${selectedBookIdentifier}". Check-in requires the specific copy number.`, 'error');
             return; // Stop if we can't get the number
        }


        const confirmResult = await MySwal.fire({
            title: 'Confirm Check-in',
            html: `Check-in book copy "<b>${bookNumberStr}</b>" from <b>${selectedClient.name}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Check-in',
            cancelButtonText: 'No, Cancel',
        });

        if (!confirmResult.isConfirmed) return;

        const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
        if (!csrfTokenElement) { Swal.fire('Error', 'CSRF token not found.', 'error'); return; }
        const csrfToken = csrfTokenElement.getAttribute('content');

        setLoading(true);
        setError(null);

        try {
             // Fetch the specific BookNumber ID based on the book_number string
             // NOTE: This requires an API endpoint or modification to fetch efficiently
             // Example using a query param on the index route (ensure backend supports this)
             const bnResponse = await fetch(route('api.book-numbers.index', { 'book_number_exact': bookNumberStr }));
             if (!bnResponse.ok) throw new Error(`Could not find details for book number ${bookNumberStr}.`);
             const bnData = await bnResponse.json();
             const bookNumberObject = bnData.book_numbers?.find((bn: any) => bn.book_number === bookNumberStr && bn.assigned_to === selectedClient.id);

             if (!bookNumberObject) {
                 throw new Error(`Book number '${bookNumberStr}' not found or it is not assigned to ${selectedClient.name}.`);
             }

             // Call the dedicated 'collect' endpoint using the found BookNumber ID
             const collectResponse = await fetch(route('api.book-numbers.collect', { bookNumber: bookNumberObject.id }), {
                method: 'PUT',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken || '' },
             });

            const collectData = await collectResponse.json();
            if (!collectResponse.ok) { throw new Error(collectData.message || `Failed to check-in book.`); }

            // Success
            Swal.fire('Success!', collectData.message || 'Book checked in successfully!', 'success');

            // Refresh client list to get updated book counts/lists
            // OPTIMIZATION: Could update local state directly instead of full refetch
            fetchClients();

            // Reset form
            setSelectedClient(null);
            setSelectedBookIdentifier(undefined);
            form.resetFields();

        } catch (error: any) {
            console.error('Error checking in book:', error);
            Swal.fire('Check-in Error', error.message || 'An error occurred during check-in.', 'error');
            setError(error.message || 'Check-in failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Book Check-in" />
            <div style={{ maxWidth: '600px', margin: 'auto', paddingTop: '20px' }}>
                <Card title="Book Check-in Process">
                     {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
                     <Spin spinning={fetchLoading} tip="Loading Clients...">
                        <Form form={form} layout="vertical" name="checkin_form">
                            {/* Client Selection */}
                            <Form.Item label="Select Client" name="client" rules={[{ required: true, message: 'Please select a client!' }]}>
                                <Select
                                    showSearch placeholder="Search or Select a client" optionFilterProp="label"
                                    onChange={handleClientChange} value={selectedClient?.id} // Use selectedClient.id for value
                                    options={clients.map((client) => ({ value: client.id, label: client.name }))}
                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                />
                            </Form.Item>

                            {/* Book Selection (Based on client's borrowed books identifiers) */}
                            <Form.Item label="Select Book to Check-in" name="bookIdentifier" rules={[{ required: true, message: 'Please select a book!' }]}>
                                <Select
                                    placeholder={selectedClient ? "Select book assigned to client" : "Select a client first"}
                                    onChange={handleBookChange}
                                    value={selectedBookIdentifier}
                                    // Provide default empty array to map to prevent error
                                    options={(selectedClient?.books || []).map((bookIdentifier) => ({ value: bookIdentifier, label: bookIdentifier }))}
                                    disabled={!selectedClient || !(selectedClient.books && selectedClient.books.length > 0)}
                                    notFoundContent={selectedClient ? "No books currently assigned to this client." : "Select a client to see their books."}
                                />
                            </Form.Item>

                            {/* Check-in Button */}
                            <Form.Item>
                                <Button
                                    type="primary"
                                    onClick={handleCheckin} // Trigger check-in logic
                                    disabled={!selectedClient || !selectedBookIdentifier || loading}
                                    loading={loading} // Show loading state
                                    block
                                >
                                    Check-in Selected Book
                                </Button>
                            </Form.Item>
                        </Form>
                     </Spin>
                </Card>
            </div>
        </AppLayout>
    );
};

// Remove any duplicate export default Checkin; line below this point
