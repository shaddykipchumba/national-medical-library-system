<?php

// Assumes controller is in: app/Http/Controllers/BorrowRequestController.php
namespace App\Http\Controllers;

use App\Models\BorrowRequest;
use App\Models\Book;
use App\Models\Client;
use App\Models\BookNumber;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse; // Correct import for redirects
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Inertia\Inertia; // Use Inertia facade for rendering Admin view
use Inertia\Response as InertiaResponse; // Alias Inertia Response type hint
use Carbon\Carbon;     // For setting due dates

/**
 * Handles operations related to Borrow Requests.
 * Includes methods for both client actions (store, destroy) via API
 * and admin actions (index, show, update) via API or Inertia page.
 */
class BorrowRequestController extends Controller
{
    // --- Configuration ---
    const MAX_BORROW_LIMIT = 5;      // Example client borrowing limit
    const DEFAULT_BORROW_DAYS = 14; // Example default loan period

    /**
     * Display a listing of borrow requests (Typically for Admin Interface).
     * Renders an Inertia view for the Admin panel.
     * Handles: GET /borrow-requests (name: admin.borrow-requests.index) (Web Route)
     * Middleware: Needs 'auth:web' + Admin check in route definition.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response|\Illuminate\Http\JsonResponse
     */
    public function index(Request $request): InertiaResponse | JsonResponse
    {
        // Note: Authorization (is Admin?) should be handled primarily by middleware.
        Log::info('BorrowRequestController: index method called (Admin View)');
        try {
            $query = BorrowRequest::with([
                           'client:id,name,email', // Eager load client details
                           'book:id,title'         // Eager load book title
                       ])->latest(); // Order newest first

            // --- Optional Filtering/Searching ---
            if ($request->filled('status')) {
                 $query->where('status', $request->status);
            }
            if ($request->filled('search')) {
                 $searchTerm = '%' . $request->search . '%';
                 $query->where(function($q) use ($searchTerm) {
                     $q->whereHas('client', fn($sq) => $sq->where('name', 'like', $searchTerm)->orWhere('email', 'like', $searchTerm))
                       ->orWhereHas('book', fn($sq) => $sq->where('title', 'like', $searchTerm));
                 });
            }
            // --- End Filtering ---

            $borrowRequests = $query->paginate(15)->withQueryString(); // Keep filters on pagination

            // Render the Inertia component for the Admin page
            // Ensure component path exists: resources/js/Pages/Admin/BorrowRequests.tsx
            return Inertia::render('BorrowRequests', [
                'borrowRequests' => $borrowRequests,
                'filters' => $request->only(['search', 'status']) // Pass filters back
            ]);

        } catch (\Exception $e) {
            Log::error('BorrowRequestController: index method error: ' . $e->getMessage());
            // Redirect back with error for Inertia page
            return back()->withErrors(['load' => 'Failed to retrieve borrow requests. Please try again.'])->withInput();
        }
    }

    /**
     * Store a newly created borrow request (Submitted by Client).
     * Handles: POST /api/client/borrow-requests (name: api.client.borrow-requests.store)
     * Middleware: Needs 'auth:client'.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('BorrowRequestController: store method called (Client Request).', $request->all());
        $clientId = Auth::guard('client')->id();
        if (!$clientId) { return response()->json(['message' => 'Unauthenticated: Client login required.'], 401); }

        $validator = Validator::make($request->all(), ['book_id' => 'required|integer|exists:books,id']);
        if ($validator->fails()) { return response()->json(['message' => 'Invalid book selected.', 'errors' => $validator->errors()], 422); }

        $validatedData = $validator->validated(); $bookId = $validatedData['book_id'];

        try {
            // Availability Check
            $book = Book::select('id', 'title', 'totalBooks', 'assignedBooks')->find($bookId);
            if (!$book || ($book->totalBooks - $book->assignedBooks) <= 0) { return response()->json(['message' => 'Sorry, this book is currently not available.'], 409); }
            // Duplicate Check
            $existingPendingRequest = BorrowRequest::where('client_id', $clientId)->where('book_id', $bookId)->where('status', 'pending')->exists();
            if ($existingPendingRequest) { return response()->json(['message' => 'You already have a pending request for this book.'], 409); }
            // Limit Check
            $client = Client::withCount('borrowedBookNumbers')->find($clientId);
            $pendingCount = BorrowRequest::where('client_id', $clientId)->where('status', 'pending')->count();
            if (($client->borrowed_book_numbers_count + $pendingCount) >= self::MAX_BORROW_LIMIT) { return response()->json(['message' => 'Borrowing limit reached (max ' . self::MAX_BORROW_LIMIT . ' items, including pending requests).'], 409); }

            // Create Request
            $borrowRequest = BorrowRequest::create(['client_id' => $clientId, 'book_id' => $bookId, 'status' => 'pending']);
            Log::info('BorrowRequestController: Client borrow request created successfully.', ['id' => $borrowRequest->id]);
            return response()->json(['message' => 'Borrow request submitted successfully.', 'borrow_request' => $borrowRequest], 201);
        } catch (\Exception $e) {
            Log::error('BorrowRequestController: store method error: ', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to submit borrow request due to a server error.'], 500);
        }
    }

    /**
     * Display the specified borrow request (e.g., for Admin API).
     * Handles: GET /api/borrow-requests/{borrowRequest} (name: api.borrow-requests.show)
     * Middleware: Needs 'auth:web' + Admin check OR 'auth:client' + ownership check (applied on route).
     *
     * @param  \App\Models\BorrowRequest  $borrowRequest
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(BorrowRequest $borrowRequest): JsonResponse
    {
        // Authorization check should be handled by middleware or Policy
        Log::info('BorrowRequestController: show method called.', ['id' => $borrowRequest->id]);
        try {
            $borrowRequest->load(['client:id,name,email', 'book:id,title,author']);
            return response()->json(['borrow_request' => $borrowRequest]);
        } catch (\Exception $e) {
             Log::error('BorrowRequestController: show method error: ' . $e->getMessage());
             return response()->json(['message' => 'Failed to retrieve borrow request details.'], 500);
        }
    }

    /**
     * Update the specified borrow request (Approve/Reject by Admin).
     * Handles: PUT /api/borrow-requests/{borrowRequest} (name: api.borrow-requests.update)
     * Middleware: Needs 'auth:web' + Admin check.
     * Returns RedirectResponse for Inertia on success.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\BorrowRequest  $borrowRequest
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function update(Request $request, BorrowRequest $borrowRequest): RedirectResponse | JsonResponse
    {
        // Authorization check for Admin should be handled by middleware
        Log::info('BorrowRequestController: update method called.', ['id' => $borrowRequest->id, 'data' => $request->all()]);

        $statusRule = Rule::in(['approved', 'rejected']);
        $baseRules = ['status' => ['required', 'string', $statusRule]];
        $conditionalRules = $request->input('status') === 'approved' ? [
            'book_number_id' => 'required|integer|exists:book_numbers,id',
            'date_to_be_returned' => 'required|date|after_or_equal:today',
        ] : [];
        $validator = Validator::make($request->all(), array_merge($baseRules, $conditionalRules));
         if ($validator->fails()) { return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422); }
        $validated = $validator->validated();

        if ($borrowRequest->status !== 'pending') { return response()->json(['message' => 'This request has already been processed.'], 409); }

        if ($validated['status'] === 'approved') {
            try {
                DB::transaction(function () use ($validated, $borrowRequest) {
                    $bookNumber = BookNumber::where('id', $validated['book_number_id'])->where('status', 'available')->where('book_id', $borrowRequest->book_id)->firstOrFail();
                    $bookNumber->update(['assigned_to' => $borrowRequest->client_id, 'status' => 'assigned', 'date_to_be_returned' => $validated['date_to_be_returned']]);
                    $borrowRequest->book()->increment('assignedBooks');
                    $borrowRequest->update(['status' => 'approved']);
                    // TODO: Notifications
                }); // End Transaction

                Log::info('BorrowRequestController: Request approved.', ['id' => $borrowRequest->id]);
                // ****** RETURN REDIRECT FOR INERTIA ******
                return redirect()->route('admin.borrow-requests.index') // Ensure this route name exists for Admin web view
                       ->with('success', 'Borrow request approved and book assigned.');

            } catch (ModelNotFoundException $e) { return response()->json(['message' => 'The selected book copy is no longer available.'], 409);
            } catch (\Exception $e) { Log::error('Approve Request Error: ' . $e->getMessage(), ['request_id' => $borrowRequest->id]); return response()->json(['message' => 'An error occurred while approving request.'], 500); }
        }
        elseif ($validated['status'] === 'rejected') {
             try {
                $borrowRequest->update(['status' => 'rejected']);
                Log::info('BorrowRequestController: Request rejected.', ['id' => $borrowRequest->id]);
                // ****** RETURN REDIRECT FOR INERTIA ******
                 return redirect()->route('admin.borrow-requests.index') // Ensure this route name exists
                       ->with('success', 'Borrow request rejected successfully.');
             } catch (\Exception $e) { Log::error('Reject Request Error: ' . $e->getMessage(), ['request_id' => $borrowRequest->id]); return response()->json(['message' => 'An error occurred while rejecting request.'], 500); }
        }
        return response()->json(['message' => 'Invalid status update provided.'], 400);
    }

    /**
     * Remove the specified borrow request from storage (Client cancels PENDING request).
     * Handles: DELETE /api/client/borrow-requests/{borrowRequest} (name: api.client.borrow-requests.destroy)
     * Middleware: Needs 'auth:client'.
     * Returns RedirectResponse for Inertia on success.
     *
     * @param  \App\Models\BorrowRequest  $borrowRequest
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function destroy(BorrowRequest $borrowRequest): RedirectResponse | JsonResponse
    {
        $clientId = Auth::guard('client')->id();
        Log::info('BorrowRequestController: destroy method called.', ['request_id' => $borrowRequest->id, 'auth_client_id' => $clientId]);

        if (!$clientId || $borrowRequest->client_id !== $clientId) { return response()->json(['message' => 'Unauthorized action.'], 403); }
        if ($borrowRequest->status !== 'pending') { return response()->json(['message' => 'Cannot cancel a request that is already processed.'], 409); }

        try {
            $deleted = $borrowRequest->delete();
            if (!$deleted) { throw new \Exception("Failed to delete BorrowRequest model."); }

            Log::info('BorrowRequestController: Borrow request deleted successfully.', ['id' => $borrowRequest->id]);
            // ****** RETURN REDIRECT FOR INERTIA ******
            return redirect()->route('client.requests.index') // Ensure this route name exists for Client web view
                   ->with('success', 'Borrow request cancelled successfully.');

        } catch (ModelNotFoundException $e) { return response()->json(['message' => 'Request not found.'], 404);
        } catch (\Exception $e) { Log::error('BorrowRequestController: destroy method error: ' . $e->getMessage()); return response()->json(['message' => 'Failed to cancel request due to a server error.'], 500); }
    }

    /**
     * Get available book numbers FOR A SPECIFIC BOOK (API).
     * Handles: GET /api/books/{book}/available-numbers (name: api.books.available-numbers)
     * Used by Admin when approving a borrow request.
     * Middleware: Needs 'auth:web' + Admin check.
     *
     * @param  \App\Models\Book  $book (Route Model Binding)
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableForBook(Book $book): JsonResponse
    {
         // Authorization should be handled by middleware
         Log::info('BorrowRequestController: getAvailableForBook called.', ['book_id' => $book->id]);
         try {
             $availableNumbers = BookNumber::where('book_id', $book->id)
                                ->where('status', 'available')
                                ->select('id', 'book_number')
                                ->orderBy('book_number')
                                ->get();
            Log::info('BorrowRequestController: getAvailableForBook successful.', ['book_id' => $book->id, 'count' => count($availableNumbers)]);
            return response()->json(['available_numbers' => $availableNumbers]);
         } catch (\Exception $e) {
             Log::error('BorrowRequestController: getAvailableForBook error: ' . $e->getMessage(), ['book_id' => $book->id]);
             return response()->json(['message' => 'Failed to retrieve available copies.'], 500);
         }
    }
}
