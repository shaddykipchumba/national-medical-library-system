<?php

// Adjust namespace if you placed it elsewhere (e.g., App\Http\Controllers\Client)
namespace App\Http\Controllers;

use App\Http\Controllers\Controller; // Extend base controller
use App\Models\Book;                // Import Book model
use App\Models\BookNumber;          // Import BookNumber model
use App\Models\Client;             // Import Client model
use App\Models\BorrowRequest;      // Import BorrowRequest model
use Illuminate\Http\Request;       // Request object (optional if not used directly)
use Illuminate\Http\JsonResponse;  // Only needed if adding JSON API methods later
use Illuminate\Support\Facades\Auth; // Import Auth facade for authentication
use Illuminate\Support\Facades\DB;   // Import DB facade for raw queries
use Illuminate\Support\Facades\Log;  // Import Log facade for logging
use Inertia\Inertia;             // Import Inertia facade
use Inertia\Response;            // Import Inertia Response type hint

/**
 * Controller handling Inertia page requests for the authenticated client area.
 */
class ClientAreaController extends Controller
{

    public function myRequests(): Response {
        $clientId = Auth::guard('client')->id();
        if (!$clientId) {
            // Handle unauthenticated client
            return redirect()->route('client.login');
        }

        // Fetch requests with related book details, ordered newest first
        $requests = BorrowRequest::where('client_id', $clientId)
                       ->with('book:id,title,author') // Eager load necessary book fields
                       ->select('id', 'book_id', 'status', 'created_at') // Select needed fields from borrow_requests
                       ->latest() // Order by created_at descending
                       ->get(); // Or ->paginate(10) for pagination

        return Inertia::render('client/MyRequests', [
            'myRequests' => $requests // Pass the requests data as a prop
        ]);
    }
    /**
     * Display the client's main dashboard.
     * Fetches and passes the count of currently borrowed books.
     * Handles route: GET /client/dashboard (name: client.home)
     * Renders view: Client/Dashboard.tsx
     *
     * @return \Inertia\Response
     */
    public function dashboard(): Response
    {
        $borrowedCount = 0; // Default count
        $client = Auth::guard('client')->user(); // Get authenticated client instance

        if ($client) {
            // Ensure client ID exists before querying
            $clientId = $client->id;
            // Use withCount for efficiency if Client model is loaded anyway
            // Or just query the count directly if client object isn't needed further
            $clientWithCount = Client::withCount('borrowedBookNumbers')->find($clientId);
            if($clientWithCount) {
                 $borrowedCount = $clientWithCount->borrowed_book_numbers_count; // Get the count (e.g., 5)
            }
            // Alternative direct count:
            // $borrowedCount = BorrowRequest::where('client_id', $clientId)->where('status','approved')->count(); // Or count BookNumbers assigned
        }

        Log::info("Client Dashboard: User ID {$client?->id}, Borrowed Count: {$borrowedCount}");

        return Inertia::render('client/dashboard', [
            'borrowedCount' => $borrowedCount, // Pass the count as a prop
        ]);
    }

    /**
     * Display the list of books currently borrowed by the authenticated client.
     * Fetches data from the BookNumber model.
     * Handles route: GET /client/my-books (name: client.books)
     * Renders view: Client/MyBooks.tsx
     *
     * @return \Inertia\Response
     */
    public function myBooks(): Response
    {
        $client = Auth::guard('client')->user();

        if (!$client) {
            Log::warning('Client MyBooks: Unauthenticated access attempt.');
            // Redirect to login if not authenticated for this page
            return redirect()->route('client.login');
            // Or return Inertia::render('Client/MyBooks', ['borrowedBooks' => []]);
        }

        $clientId = $client->id;

        // Query BookNumber model for books assigned to this client
        $borrowedBookNumbers = BookNumber::where('assigned_to', $clientId)
            ->where('status', 'assigned') // Status indicating currently borrowed
            ->with('book:id,title') // Eager load only necessary Book fields
            ->select('id', 'book_id', 'book_number', 'created_at', 'date_to_be_returned')
            ->latest('created_at') // Order by borrow date (newest first)
            ->get();

        // Transform the data for the frontend component
        $borrowedBooksProp = $borrowedBookNumbers->map(function ($bookNumber) {
            return [
                'id' => $bookNumber->id, // Unique ID (usually the BookNumber ID)
                'title' => $bookNumber->book?->title ?? 'Unknown Title', // Get title via relationship
                'book_number' => $bookNumber->book_number,
                'borrowed_date' => optional($bookNumber->created_at)->toDateString(), // Assume created_at is borrow date
                'due_date' => $bookNumber->date_to_be_returned, // Use the due date field
            ];
        });

         Log::info("Client MyBooks: User ID {$clientId}, Found {$borrowedBooksProp->count()} borrowed books.");

        return Inertia::render('client/MyBooks', [
            'borrowedBooks' => $borrowedBooksProp // Pass transformed data
        ]);
    }

    /**
     * Display the library Browse page showing available books.
     * Fetches data from the Book model based on availability and passes pending request IDs.
     * Handles route: GET /client/library (name: client.library.browse)
     * Renders view: Client/LibraryBrowse.tsx
     *
     * @return \Inertia\Response
     */
    public function libraryBrowse(Request $request): Response // ****** Add Request parameter ******
    {
        $clientId = Auth::guard('client')->id();

        // Get search term from query string (?search=...)
        $searchTerm = $request->query('search'); // ****** GET SEARCH TERM ******

        // Start Query for Available Books
        $bookQuery = Book::where(DB::raw('totalBooks - assignedBooks'), '>', 0)
                       ->select('id', 'title', 'author', 'year');

        // ****** APPLY SEARCH FILTER ******
        if ($searchTerm) {
            $bookQuery->where(function($query) use ($searchTerm) {
                $query->where('title', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('author', 'LIKE', '%' . $searchTerm . '%');
            });
        }
        // ****** END SEARCH FILTER ******

        // Paginate the results
        $availableBooks = $bookQuery->orderBy('title')->paginate(12)->withQueryString();

        // Get pending request IDs for the books on the current page
        $pendingRequestBookIds = [];
        if ($clientId && $availableBooks->isNotEmpty()) {
            $bookIdsOnPage = $availableBooks->pluck('id');
            $pendingRequestBookIds = BorrowRequest::where('client_id', $clientId)
                                      ->whereIn('book_id', $bookIdsOnPage)
                                      ->where('status', 'pending')
                                      ->pluck('book_id')->unique()->all();
        }

        return Inertia::render('client/LibraryBrowse', [
            'availableBooks' => $availableBooks,
            'pendingRequestBookIds' => $pendingRequestBookIds,
            // ****** PASS FILTERS BACK TO VIEW ******
            'filters' => ['search' => $searchTerm]
        ]);
    }

}
