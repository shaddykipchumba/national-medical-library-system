import React, { useState, useEffect } from 'react';
import { Table, Card, Spin, Breadcrumb, Select, DatePicker, Button, Form } from 'antd';
import moment from 'moment';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

const MySwal = withReactContent(Swal);

interface Client {
  id: number;
  name: string;
  phoneNumber: string;
}

interface Book {
  id: number;
  title: string;
}

interface BookNumberRecord {
  id: number;
  book_id: number;
  book_number: string;
  status: string;
  assigned_to?: number | null;
  date_to_be_returned: string | null;
}

const Overdues = () => {
  const [loading, setLoading] = useState(false);
  const [overdueRecords, setOverdueRecords] = useState<BookNumberRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);

  // Fetch clients for lookup (to get name and phoneNumber)
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Fetch books for populating the Book Title select
  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  // Fetch overdue book number records from the API
  const fetchOverdueRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/book-numbers/overdue');
      if (response.ok) {
        const data = await response.json();
        // Filter records to include only those where the current date is past date_to_be_returned
        const filtered = data.book_numbers.filter((record: BookNumberRecord) => {
          if (!record.date_to_be_returned) return false;
          return moment().isAfter(moment(record.date_to_be_returned));
        });
        setOverdueRecords(filtered);
      } else {
        MySwal.fire('Error', 'Failed to fetch overdue records.', 'error');
      }
    } catch (error: any) {
      MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchBooks();
    fetchOverdueRecords();
  }, []);

  // Filter records based on selected book title and return date
  const filteredRecords = overdueRecords.filter(record => {
    let match = true;
    if (selectedBook) {
      match = match && record.book_id === selectedBook;
    }
    if (selectedDate) {
      if (record.date_to_be_returned) {
        match = match && moment(record.date_to_be_returned).isSame(selectedDate, 'day');
      }
    }
    return match;
  });

  // Helper to get book title from book_id
  const getBookTitle = (book_id: number) => {
    const book = books.find(b => b.id === book_id);
    return book ? book.title : 'Unknown Title';
  };

  // Helper to get client details from assigned_to
  const getClientDetails = (clientId: number | null) => {
    if (!clientId) return { name: 'N/A', phoneNumber: 'N/A' };
    const client = clients.find(c => c.id === clientId);
    return client ? { name: client.name, phoneNumber: client.phoneNumber } : { name: 'Unknown', phoneNumber: 'Unknown' };
  };

  // Handler for penalize action
  const handlePenalize = async (record: BookNumberRecord) => {
    if (!record.date_to_be_returned) return;

    // Calculate days overdue (current date minus return date)
    const dueDate = moment(record.date_to_be_returned);
    const currentDate = moment();
    const daysOverdue = currentDate.diff(dueDate, 'days');
    if (daysOverdue <= 0) {
      MySwal.fire('Info', 'This record is not overdue.', 'info');
      return;
    }

    // Prompt for penalty per day using SweetAlert2
    const { value: penaltyPerDay } = await MySwal.fire({
      title: 'Penalize',
      text: `Enter penalty amount per day (Days overdue: ${daysOverdue})`,
      input: 'number',
      inputLabel: 'Penalty per day',
      inputPlaceholder: 'Enter amount',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return 'Please enter a valid penalty amount';
        }
        return null;
      }
    });

    if (!penaltyPerDay) return;

    const feeAmount = Number(penaltyPerDay) * daysOverdue;
    const clientDetails = getClientDetails(record.assigned_to || null);

    // Confirm penalization details with the user
    const confirmResult = await MySwal.fire({
      title: 'Confirm Penalization',
      html: `
        <p>Client: ${clientDetails.name}</p>
        <p>Phone: ${clientDetails.phoneNumber}</p>
        <p>Date to be Returned: ${record.date_to_be_returned}</p>
        <p>Days Overdue: ${daysOverdue}</p>
        <p>Fee Amount: ${feeAmount}</p>
        <p>Do you want to proceed?</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Penalize',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    // Retrieve CSRF token for secured requests
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenElement) {
      MySwal.fire('Error', 'CSRF token not found.', 'error');
      return;
    }
    const csrfToken = csrfTokenElement.getAttribute('content');

    // Prepare the penalty data payload
    const penaltyData = {
      client_name: clientDetails.name,
      client_phone: clientDetails.phoneNumber,
      date_to_be_returned: record.date_to_be_returned,
      days_overdue: daysOverdue,
      fee_amount: feeAmount,
    };

    try {
      const response = await fetch('/api/penalties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(penaltyData),
      });

      if (response.ok) {
        MySwal.fire('Success', 'Penalty record created successfully!', 'success');
        // Optionally refresh overdue records after successful submission
        fetchOverdueRecords();
      } else {
        throw new Error('Failed to create penalty record');
      }
    } catch (error: any) {
      MySwal.fire('Error', error.message || 'An unexpected error occurred.', 'error');
    }
  };

  const columns = [
    {
      title: 'Book Title',
      dataIndex: 'book_id',
      key: 'book_id',
      render: (book_id: number) => getBookTitle(book_id),
    },
    { title: 'Book Number', dataIndex: 'book_number', key: 'book_number' },
    {
      title: 'Client Name',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assigned_to: number | null) => getClientDetails(assigned_to).name,
    },
    {
      title: 'Client Phone',
      dataIndex: 'assigned_to',
      key: 'client_phone',
      render: (assigned_to: number | null) => getClientDetails(assigned_to).phoneNumber,
    },
    { title: 'Date to be Returned', dataIndex: 'date_to_be_returned', key: 'date_to_be_returned' },
    {
      title: 'Days Overdue',
      key: 'days_overdue',
      render: (_: any, record: BookNumberRecord) => {
        if (!record.date_to_be_returned) return 'N/A';
        const daysOverdue = moment().diff(moment(record.date_to_be_returned), 'days');
        return daysOverdue > 0 ? daysOverdue : 0;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: BookNumberRecord) => (
        <Button type="primary" onClick={() => handlePenalize(record)}>
          Penalize
        </Button>
      ),
    },
  ];

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Overdues', href: '/overdues' }]}>
      <Head title="Overdues" />
      <div style={{ padding: '16px' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>Overdues</Breadcrumb.Item>
        </Breadcrumb>
        <Card title="Overdue Books">
          <Form layout="inline" style={{ marginBottom: '16px' }}>
            <Form.Item label="Book Title">
              <Select
                placeholder="Select Book"
                style={{ width: 200 }}
                allowClear
                value={selectedBook}
                onChange={(value) => setSelectedBook(value)}
              >
                {books.map((book) => (
                  <Select.Option key={book.id} value={book.id}>
                    {book.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Return Date">
            <DatePicker
  placeholder="Select Date"
  value={selectedDate}
  onChange={(date) => setSelectedDate(date)}
  disabledDate={(current) => current && current > moment().endOf('day')}
/>

            </Form.Item>
          </Form>
          {loading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={filteredRecords}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default Overdues;
