<?php

namespace App\Http\Controllers;

use App\Models\BookNumber;
use App\Models\Book;
use App\Models\Penalty; // Make sure you have this model
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BookNumberController extends Controller
{
    /**
     * Display a listing of the book numbers for a specific book.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        Log::info('BookNumberController: index method called');

        try {
            $bookId = $request->query('book_id');

            // Require a book_id to be passed
            if (!$bookId) {
                Log::warning('BookNumberController: index method error: Book ID is required.');
                return response()->json(['error' => 'Book ID is required'], 422);
            }

            $search = $request->query('search');

            // Query only for the specific book_id
            $query = BookNumber::where('book_id', $bookId);

            if ($search) {
                $query->where('book_number', 'like', '%' . $search . '%');
            }

            $bookNumbers = $query->get();

            Log::info('BookNumberController: index method successful, found ' . count($bookNumbers) . ' book numbers');

            return response()->json(['book_numbers' => $bookNumbers], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: index method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created book number in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('BookNumberController: store method called');

        $validator = Validator::make($request->all(), [
            'book_id' => 'required|integer',
            'book_number' => 'required|string|max:255|unique:book_numbers',
            'status' => 'required|string|in:available,assigned',
        ]);

        if ($validator->fails()) {
            Log::warning('BookNumberController: store method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $bookNumber = BookNumber::create($validator->validated());
            Log::info('BookNumberController: store method successful, book number ID: ' . $bookNumber->id);
            return response()->json(['message' => 'Book number created successfully', 'book_number' => $bookNumber], 201);
        } catch (\Exception $e) {
            Log::error('BookNumberController: store method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified book number.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id)
    {
        Log::info('BookNumberController: show method called, ID: ' . $id);

        try {
            $bookNumber = BookNumber::findOrFail($id);
            Log::info('BookNumberController: show method successful, book number ID: ' . $bookNumber->id);
            return response()->json(['book_number' => $bookNumber], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: show method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified book number in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id)
    {
        Log::info('BookNumberController: update method called, ID: ' . $id);

        $validator = Validator::make($request->all(), [
            'book_number' => 'string|max:255|unique:book_numbers,book_number,' . $id,
            'status' => 'string|in:available,assigned',
            'assigned_to' => 'nullable|integer',
            'date_to_be_returned' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            Log::warning('BookNumberController: update method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $bookNumber = BookNumber::findOrFail($id);
            $bookNumber->update($validator->validated());
            Log::info('BookNumberController: update method successful, book number ID: ' . $bookNumber->id);
            return response()->json(['message' => 'Book number updated successfully', 'book_number' => $bookNumber], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: update method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified book number from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id)
    {
        Log::info('BookNumberController: destroy method called, ID: ' . $id);

        try {
            $bookNumber = BookNumber::findOrFail($id);
            $bookNumber->delete();
            Log::info('BookNumberController: destroy method successful, book number ID: ' . $id);
            return response()->json(['message' => 'Book number deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: destroy method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Assign a book number to a user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\BookNumber  $bookNumber
     * @return \Illuminate\Http\JsonResponse
     */
   /**
     * Assign a book number to a user/client (API).
     * Handles: PUT /api/book-numbers/{bookNumber}/assign
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\BookNumber  $bookNumber (Route Model Binding)
     * @return \Illuminate\Http\JsonResponse
     */
    public function assign(Request $request, $bookNumberId) // Or use Route Model Binding: (Request $request, BookNumber $bookNumber)
    {
        // --- START VALIDATION ---
        $validatedData = $request->validate([
            // Ensure 'assigned_to' is provided, is an integer, AND exists in the 'id' column of the 'clients' table
            'assigned_to' => ['required', 'integer', 'exists:clients,id'],

            // Ensure 'date_to_be_returned' is provided, is a valid date, and not in the past
            // Adjust format if needed, YYYY-MM-DD is standard from frontend DatePicker
            'date_to_be_returned' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
        ]);
        // --- END VALIDATION ---

        // Find the specific book number instance. Use findOrFail to automatically handle not found.
        $bookNumber = BookNumber::findOrFail($bookNumberId); // If using Route Model Binding, you already have $bookNumber

        // Optional but Recommended: Check if the book is actually available
        // Replace 'available' with your actual status value/enum if different
        if ($bookNumber->status !== 'available') {
             // Return a specific error response (e.g., 409 Conflict)
             return response()->json(['message' => 'This book copy is currently not available for assignment.'], 409);
        }

        // Optional: Add logic here to check client borrowing limits if applicable

        // --- Perform the Assignment ---
        $bookNumber->status = 'assigned'; // Use the correct status string/enum
        $bookNumber->assigned_to = $validatedData['assigned_to']; // Use validated data
        $bookNumber->date_to_be_returned = $validatedData['date_to_be_returned']; // Use validated data
        $bookNumber->save(); // Eloquent handles the update and updated_at timestamp

        // Return a success response
        return response()->json(['message' => 'Book assigned successfully!']);
    }


    /**
     * Collect a book number from a user.
     *
     * @param  \App\Models\BookNumber  $bookNumber
     * @return \Illuminate\Http\JsonResponse
     */
    public function collect(BookNumber $bookNumber)
    {
        Log::info('BookNumberController: collect method called, book number ID: ' . $bookNumber->id);

        try {
            $bookNumber->update([
                'assigned_to' => null,
                'date_to_be_returned' => null,
                'status' => 'available',
            ]);
            Log::info('BookNumberController: collect method successful, book number ID: ' . $bookNumber->id);
            return response()->json(['message' => 'Book number collected successfully', 'book_number' => $bookNumber], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: collect method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the book details and associated book numbers.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function details(int $id)
    {
        Log::info('BookNumberController: showDetails method called, ID: ' . $id);

        try {
            $book = Book::findOrFail($id);
            $bookNumbers = BookNumber::where('book_id', $id)->get();

            Log::info('BookNumberController: showDetails method successful, book numbers found: ' . count($bookNumbers));

            return Inertia::render('BookDetails', [
                'id' => $id,
                'book' => $book,
                'bookNumbers' => $bookNumbers,
            ]);
        } catch (\Exception $e) {
            Log::error('BookNumberController: showDetails method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get assigned book numbers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssigned()
    {
        Log::info('BookNumberController: getAssigned method called');

        try {
            $bookNumbers = BookNumber::where('status', 'assigned')->get();
            Log::info('BookNumberController: getAssigned method successful, found ' . count($bookNumbers) . ' assigned book numbers');
            return response()->json(['book_numbers' => $bookNumbers], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: getAssigned method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get available book numbers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailable()
    {
        Log::info('BookNumberController: getAvailable method called');

        try {
            $bookNumbers = BookNumber::where('status', 'available')->get();
            Log::info('BookNumberController: getAvailable method successful, found ' . count($bookNumbers) . ' available book numbers');
            return response()->json(['book_numbers' => $bookNumbers], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: getAvailable method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get almost overdue book numbers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAlmostOverdue()
    {
        Log::info('BookNumberController: getAlmostOverdue method called');

        try {
            $bookNumbers = BookNumber::where('date_to_be_returned', '<=', now()->addDays(2))
                ->where('status', 'assigned')
                ->get();
            Log::info('BookNumberController: getAlmostOverdue method successful, found ' . count($bookNumbers) . ' almost overdue book numbers');
            return response()->json(['book_numbers' => $bookNumbers], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: getAlmostOverdue method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get overdue book numbers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOverdue()
    {
        Log::info('BookNumberController: getOverdue method called');

        try {
            $bookNumbers = BookNumber::where('date_to_be_returned', '<', now())
                ->where('status', 'assigned')
                ->get();
            Log::info('BookNumberController: getOverdue method successful, found ' . count($bookNumbers) . ' overdue book numbers');
            return response()->json(['book_numbers' => $bookNumbers], 200);
        } catch (\Exception $e) {
            Log::error('BookNumberController: getOverdue method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a penalty record for an overdue book.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function penalize(Request $request)
    {
        Log::info('BookNumberController: penalize method called');

        $validator = Validator::make($request->all(), [
            'client_name'         => 'required|string|max:255',
            'client_phone'        => 'required|string|max:20',
            'date_to_be_returned' => 'required|date',
            'days_overdue'        => 'required|integer|min:1',
            'fee_amount'          => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            Log::warning('BookNumberController: penalize method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $penalty = Penalty::create($validator->validated());
            Log::info('BookNumberController: penalize method successful, penalty ID: ' . $penalty->id);
            return response()->json(['message' => 'Penalty record created successfully', 'penalty' => $penalty], 201);
        } catch (\Exception $e) {
            Log::error('BookNumberController: penalize method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
