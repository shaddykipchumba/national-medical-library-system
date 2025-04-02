import React, { useState, useEffect } from 'react';
import { Table, Card, Spin, Breadcrumb, Tabs } from 'antd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

const { TabPane } = Tabs;
const MySwal = withReactContent(Swal);

interface Client {
  id: number;
  name: string;
  books: string[];
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
  updated_at?: string;
  date_to_be_returned?: string | null;
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  const [clients, setClients] = useState<Client[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [assignedBooks, setAssignedBooks] = useState<BookNumberRecord[]>([]);
  const [availableBooks, setAvailableBooks] = useState<BookNumberRecord[]>([]);
  const [almostOverdueBooks, setAlmostOverdueBooks] = useState<BookNumberRecord[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<BookNumberRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch clients for lookup in the "Assigned To" column
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

  // Fetch books from the books table to display titles
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

  // Generic function to fetch report data from an endpoint
  const fetchReport = async (endpoint: string, setter: (data: BookNumberRecord[]) => void) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setter(data.book_numbers || []);
      } else {
        MySwal.fire('Error', 'Failed to fetch report data.', 'error');
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
  }, []);

  // Fetch report data when the active tab changes
  useEffect(() => {
    if (activeTab === 'assigned') {
      fetchReport('/api/book-numbers/assigned', setAssignedBooks);
    } else if (activeTab === 'available') {
      fetchReport('/api/book-numbers/available', setAvailableBooks);
    } else if (activeTab === 'almostOverdue') {
      fetchReport('/api/book-numbers/almost-overdue', setAlmostOverdueBooks);
    } else if (activeTab === 'overdue') {
      fetchReport('/api/book-numbers/overdue', setOverdueBooks);
    }
  }, [activeTab]);

  // Helper function to lookup book title by book_id
  const renderBookTitle = (book_id: number): string => {
    const book = books.find((b) => b.id === book_id);
    return book ? book.title : 'Unknown Title';
  };

  // Columns for detailed views (Assigned, Almost Overdue, Overdue)
  const detailedColumns = [
    {
      title: 'Book Title',
      dataIndex: 'book_id',
      key: 'book_id',
      render: (book_id: number) => renderBookTitle(book_id)
    },
    { title: 'Book Number', dataIndex: 'book_number', key: 'book_number' },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assigned_to: number | null) => {
        if (!assigned_to) return 'N/A';
        const client = clients.find(c => c.id === assigned_to);
        return client ? `${client.name} (${client.id})` : `ID: ${assigned_to}`;
      }
    },
    { title: 'Date Assigned', dataIndex: 'updated_at', key: 'updated_at' },
    { title: 'Date to be Returned', dataIndex: 'date_to_be_returned', key: 'date_to_be_returned' },
  ];

  // Columns for available books view
  const availableColumns = [
    {
      title: 'Book Title',
      dataIndex: 'book_id',
      key: 'book_id',
      render: (book_id: number) => renderBookTitle(book_id)
    },
    { title: 'Book Number', dataIndex: 'book_number', key: 'book_number' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ];

  // Return appropriate table data and columns based on the active tab
  const getTableData = () => {
    if (activeTab === 'assigned') return { data: assignedBooks, columns: detailedColumns };
    if (activeTab === 'available') return { data: availableBooks, columns: availableColumns };
    if (activeTab === 'almostOverdue') return { data: almostOverdueBooks, columns: detailedColumns };
    if (activeTab === 'overdue') return { data: overdueBooks, columns: detailedColumns };
    return { data: [], columns: [] };
  };

  const { data, columns } = getTableData();

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Reports', href: '/reports' }]}>
      <Head title="Reports" />
      <div style={{ padding: '16px' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>Reports</Breadcrumb.Item>
        </Breadcrumb>
        <Card title="Book Reports">
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
            <TabPane tab="Assigned Books" key="assigned" />
            <TabPane tab="Available Books" key="available" />
            <TabPane tab="Almost Overdue" key="almostOverdue" />
            <TabPane tab="Overdue" key="overdue" />
          </Tabs>
          {loading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={data}
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

export default Reports;
