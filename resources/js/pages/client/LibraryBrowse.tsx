import React, { useState, useEffect } from 'react';
import ClientLayout from '@/Layouts/client-layout'; // Your Client Area Layout
import { Head, Link, router, usePage } from '@inertiajs/react'; // Import router
// Ant Design Components
import { Card, Row, Col, Typography, Button, Empty, Space, Pagination, Input, Alert } from 'antd';
// Ant Design Icons
import { BookOutlined, UserOutlined, CalendarOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
// Types
import type { PageProps } from '@/types'; // Your global PageProps type
// SweetAlert for confirmations/feedback
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// Optional: Debounce for search-as-you-type
// import { debounce } from 'lodash';

const MySwal = withReactContent(Swal);
const { Search } = Input; // Destructure Search component from Input

// Declare route function if not globally typed by Ziggy/TypeScript setup
declare function route(name: string, params?: any, absolute?: boolean): string;

// --- TypeScript Interfaces ---

interface BookItem { id: number; title: string; author: string; year: number; }
interface PaginatorLink { url: string | null; label: string; active: boolean; }
interface Paginator<T> {
    data: T[]; links: PaginatorLink[]; current_page: number; last_page: number;
    total: number; per_page: number; path: string; prev_page_url: string | null; next_page_url: string | null;
    from: number; to: number;
}
interface LibraryBrowseProps extends PageProps {
    availableBooks: Paginator<BookItem>; // Paginated book data from controller
    pendingRequestBookIds: number[]; // IDs of books with pending requests by this client
    filters: { // Current filters applied by controller
        search?: string;
    }
}
interface BookCardProps {
    book: BookItem;
    onBorrowRequest: (bookId: number) => void;
    isRequesting: number | null;
    hasRequested: boolean;
}
interface AvailableNumber { id: number; book_number: string; }

// --- Reusable Book Card Component ---
const BookCard = ({ book, onBorrowRequest, isRequesting, hasRequested }: BookCardProps) => (
    <Card
        hoverable
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        actions={[
            <Button
                key="borrow"
                type={hasRequested ? "default" : "primary"}
                icon={hasRequested ? <CheckOutlined /> : <ShoppingCartOutlined />}
                size="small"
                onClick={() => !hasRequested && onBorrowRequest(book.id)}
                loading={isRequesting === book.id}
                disabled={hasRequested || (isRequesting !== null && isRequesting !== book.id)}
            >
                {hasRequested ? 'Requested' : 'Request Borrow'}
            </Button>,
        ]}
    >
        <Card.Meta
            title={<Typography.Text ellipsis={{ tooltip: book.title }}>{book.title}</Typography.Text>} // Add ellipsis and tooltip for long titles
            description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                     <Typography.Text type="secondary" ellipsis={{ tooltip: book.author }}>
                        <UserOutlined style={{ marginRight: 8 }}/>{book.author}
                     </Typography.Text>
                     <Typography.Text type="secondary">
                        <CalendarOutlined style={{ marginRight: 8 }}/>{book.year}
                     </Typography.Text>
                </Space>
            }
        />
    </Card>
);


// --- Main Library Browse Component ---
export default function LibraryBrowse({ availableBooks, pendingRequestBookIds, filters }: LibraryBrowseProps) {
    const pageTitle = "Browse Available Books";
    const { auth, errors: inertiaErrors } = usePage<LibraryBrowseProps>().props; // Get auth info and inertia errors

    // State for loading indicator on specific request buttons
    const [requestLoading, setRequestLoading] = useState<number | null>(null);
    // State combining initially pending requests and newly requested ones this session
    const [requestedBookIds, setRequestedBookIds] = useState<Set<number>>(
        new Set(pendingRequestBookIds || [])
    );
    // State for the search input field, initialized with filter from props
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    // State for potential general fetch errors
    const [fetchError, setFetchError] = useState<string | null>(null);


    // --- Borrow Request Handler ---
    const handleBorrowRequest = (bookId: number) => {
        const client = auth.user;
        if (!client?.id) { MySwal.fire('Authentication Error', 'Could not identify user.', 'error'); return; }
        const clientId = client.id;
        const bookTitle = availableBooks.data.find(b => b.id === bookId)?.title || 'this book';

        MySwal.fire({
            title: 'Confirm Borrow Request', html: `Request to borrow <strong>${bookTitle}</strong>?`, icon: 'question',
            showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Request Book!', cancelButtonText: 'No, Cancel', reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                setRequestLoading(bookId);
                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.getAttribute('content');
                if (!csrfToken) { MySwal.fire('Error', 'Security token missing.', 'error'); setRequestLoading(null); return; }

                try {
                    // **IMPORTANT**: Ensure 'api.client.borrow-requests.store' route name is correct
                    const response = await fetch(route('api.client.borrow-requests.store'), {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                        body: JSON.stringify({ book_id: bookId, client_id: clientId })
                    });
                    const responseData = await response.json();
                    if (response.ok) {
                        MySwal.fire('Requested!', responseData.message || 'Request submitted.', 'success');
                        setRequestedBookIds(prevIds => new Set(prevIds).add(bookId)); // Update state to disable button
                    } else { MySwal.fire('Request Failed', responseData.message || 'Could not submit request.', 'error'); }
                } catch (error: any) { MySwal.fire('Network Error', 'Unable to send request.', 'error'); }
                 finally { setRequestLoading(null); }
            }
        });
    };

    // --- Search Handler ---
    const handleSearch = (value: string) => {
        const currentSearch = filters?.search || '';
        // Only search if the term actually changed
        if (value.trim() !== currentSearch.trim()) {
            router.get(route('client.library.browse'), { search: value }, { // Send search query to backend
                preserveState: true, // Keep component state (like requestedBookIds)
                preserveScroll: true, // Keep scroll position
                replace: true, // Don't add entry to browser history
                // Optionally only reload the 'availableBooks' prop: only: ['availableBooks', 'filters', 'pendingRequestBookIds'],
            });
        }
    };

    return (
        <ClientLayout title={pageTitle}>
            <Head title={pageTitle} />

            {/* Page Header */}
            <div style={{ marginBottom: '16px' }}>
                <Typography.Title level={2} style={{ margin: 0 }}>
                    <BookOutlined style={{ marginRight: '10px' }} />
                    {pageTitle}
                </Typography.Title>
                 <Typography.Paragraph type="secondary" style={{ marginTop: '8px' }}>
                    Explore our collection. Use the search below or click 'Request Borrow' on a book.
                </Typography.Paragraph>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
                <Search
                    placeholder="Search by Title or Author..."
                    enterButton="Search"
                    size="large"
                    value={searchTerm} // Controlled input reflecting current state/filter
                    onChange={(e) => setSearchTerm(e.target.value)} // Update state while typing
                    onSearch={handleSearch} // Trigger search on Enter or button click
                    allowClear // Add clear button
                    loading={usePage<LibraryBrowseProps>().props.inertia?.processing} // Show loading during Inertia visit
                />
            </div>

             {/* Display potential fetch errors */}
             {fetchError && <Alert message={fetchError} type="error" showIcon closable onClose={() => setFetchError(null)} style={{ marginBottom: 16 }}/>}

            {/* Book Grid or Empty State */}
            {/* Check paginated data: availableBooks.data */}
            {availableBooks && availableBooks.data.length > 0 ? (
                <>
                    <Row gutter={[16, 24]}>
                        {availableBooks.data.map((book) => (
                            <Col key={book.id} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex' }}>
                                <BookCard
                                    book={book}
                                    onBorrowRequest={handleBorrowRequest}
                                    isRequesting={requestLoading}
                                    hasRequested={requestedBookIds.has(book.id)} // Pass combined requested state
                                 />
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination Controls */}
                    <Row justify="center" style={{ marginTop: '24px' }}>
                        <Space>
                            <Link href={availableBooks.prev_page_url ?? '#'} preserveScroll preserveState replace disabled={!availableBooks.prev_page_url}>
                                <Button disabled={!availableBooks.prev_page_url}>Previous</Button>
                            </Link>
                            <Typography.Text>
                                Page {availableBooks.current_page} of {availableBooks.last_page} (Items {availableBooks.from}-{availableBooks.to} of {availableBooks.total})
                            </Typography.Text>
                            <Link href={availableBooks.next_page_url ?? '#'} preserveScroll preserveState replace disabled={!availableBooks.next_page_url}>
                                 <Button disabled={!availableBooks.next_page_url}>Next</Button>
                            </Link>
                        </Space>
                    </Row>
                </>
            ) : (
                 <Card bordered={false}>
                     {/* Show different message if search term exists */}
                    <Empty description={filters?.search ? `No available books found matching "${filters.search}".` : "No available books found in the library collection."} />
                 </Card>
            )}
        </ClientLayout>
    );
}

// Layout assignment (can often be handled globally)
// LibraryBrowse.layout = (page: React.ReactElement<LibraryBrowseProps>) => (
//     <ClientLayout title="Browse Library" children={page} />
// );
