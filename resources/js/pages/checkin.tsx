import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Form, Spin } from 'antd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const MySwal = withReactContent(Swal);

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Checkin', href: '/checkin' },
];

interface Client {
  id: number;
  name: string;
  books: string[];
}

const Checkin = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData.clients);
      } else {
        // If resource not found or another error, alert the user
        Swal.fire('Error', `Failed to load clients: ${response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      Swal.fire('Error', 'An unexpected error occurred while fetching clients.', 'error');
    }
  };

  const handleClientChange = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    setSelectedClient(client || null);
    setSelectedBook(null);
  };

  const handleBookChange = (bookIdentifier: string) => {
    setSelectedBook(bookIdentifier);
  };

  const handleCheckin = async () => {
    if (!selectedClient || !selectedBook) {
      Swal.fire('Error', 'Please select a client and a book.', 'error');
      return;
    }

    const confirmResult = await MySwal.fire({
      title: 'Confirm Checkin',
      text: `Checkin book "${selectedBook}" from ${selectedClient.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Checkin it!',
      cancelButtonText: 'No, Cancel',
    });

    if (!confirmResult.isConfirmed) return;

    // Retrieve CSRF token from meta tag; if missing, notify the user.
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenElement) {
      Swal.fire('Error', 'CSRF token not found. Please refresh the page and try again.', 'error');
      return;
    }
    const csrfToken = csrfTokenElement.getAttribute('content');

    setLoading(true);
    try {
      // Remove the selected book from the client's book list
      const updatedBooks = selectedClient.books.filter((book) => book !== selectedBook);

      const clientResponse = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify({ books: updatedBooks }),
      });

      if (!clientResponse.ok) {
        // Handle potential CSRF or not found issues (like 419 or 404)
        throw new Error(`Client update failed: ${clientResponse.statusText}`);
      }

      // Parse book identifier into title and number (format: "Book Title - BookNumber")
      const [bookTitle, bookNumberStr] = selectedBook.split(' - ');
      // Fetch books data to get the book id based on the title
      const booksResponse = await fetch('/api/books');
      if (!booksResponse.ok) {
        throw new Error(`Fetching books failed: ${booksResponse.statusText}`);
      }
      const booksData = await booksResponse.json();
      const book = booksData.books.find((b: any) => b.title === bookTitle);

      if (!book) {
        throw new Error('Book not found');
      }

      // Fetch the book numbers for the selected book
      const bnResponse = await fetch(`/api/book-numbers?book_id=${book.id}`);
      if (!bnResponse.ok) {
        throw new Error(`Fetching book numbers failed: ${bnResponse.statusText}`);
      }
      const bnData = await bnResponse.json();
      const bookNumberObject = bnData.book_numbers.find((bn: any) => bn.book_number === bookNumberStr);

      if (!bookNumberObject) {
        throw new Error('Book number record not found');
      }

      // Update the book number record to mark as available
      const bnUpdateResponse = await fetch(`/api/book-numbers/${bookNumberObject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify({
          status: 'available',
          date_to_be_returned: null,
          assigned_to: null,
        }),
      });

      if (!bnUpdateResponse.ok) {
        throw new Error(`Failed to update the book number: ${bnUpdateResponse.statusText}`);
      }

      Swal.fire('Success', 'Book checked in successfully!', 'success');
      // Reset the component state and refresh clients
      setSelectedClient(null);
      setSelectedBook(null);
      form.resetFields();
      fetchClients();
    } catch (error: any) {
      console.error('Error checking in book:', error);
      Swal.fire('Error', error.message || 'An error occurred while checking in the book.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Checkin" />
      <div className="flex justify-center items-center h-full p-4">
        <Card title="Book Checkin" className="w-full max-w-md">
          <Form form={form} layout="vertical">
            <Form.Item label="Client">
              <Select
                showSearch
                placeholder="Select a client"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as React.ReactNode)
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleClientChange}
                value={selectedClient?.id}
                options={clients.map((client) => ({ value: client.id, label: client.name }))}
              />
            </Form.Item>

            <Form.Item label="Book to Checkin">
              <Select
                placeholder="Select a book"
                onChange={handleBookChange}
                value={selectedBook}
                options={selectedClient?.books.map((book) => ({ value: book, label: book }))}
                disabled={!selectedClient}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                onClick={handleCheckin}
                disabled={!selectedClient || !selectedBook}
                block
              >
                {loading ? <Spin size="small" /> : 'Checkin'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Checkin;
