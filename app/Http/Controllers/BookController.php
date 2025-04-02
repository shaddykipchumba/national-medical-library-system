<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log; // Import the Log facade

class BookController extends Controller
{
    /**
     * Display a listing of the books.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        Log::info('BookController: index method called'); // Log the method call
        try {
            $books = Book::all();
            Log::info('BookController: index method successful'); // Log success
            return response()->json(['books' => $books], 200);
        } catch (\Exception $e) {
            Log::error('BookController: index method error: ' . $e->getMessage()); // Log error
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created book in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('BookController: store method called'); // Log the method call
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'year' => 'required|integer|min:1000|max:' . date('Y'),
            'totalBooks' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            Log::warning('BookController: store method validation failed: ' . json_encode($validator->errors())); // Log validation errors
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $book = Book::create($validator->validated());
            Log::info('BookController: store method successful, book ID: ' . $book->id); // Log success
            return response()->json(['message' => 'Book created successfully', 'book' => $book], 201);
        } catch (\Exception $e) {
            Log::error('BookController: store method error: ' . $e->getMessage()); // Log error
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified book.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    // In your BookController.php
public function show(int $id)
{
    try {
        $book = Book::findOrFail($id);
        return Inertia::render('BookDetails', [
            'id' => $id, // Pass the id as a prop
            'book' => $book, // Pass the book data
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    /**
     * Update the specified book in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id)
    {
        Log::info('BookController: update method called, ID: ' . $id); // Log the method call and ID
        $book = Book::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'author' => 'string|max:255',
            'year' => 'integer|min:1000|max:' . date('Y'),
            'totalBooks' => 'integer|min:0',
            'assignedBooks' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            Log::warning('BookController: update method validation failed: ' . json_encode($validator->errors())); // Log validation errors
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $book->update($validator->validated());
            Log::info('BookController: update method successful, book ID: ' . $book->id); // Log success
            return response()->json(['message' => 'Book updated successfully', 'book' => $book], 200);
        } catch (\Exception $e) {
            Log::error('BookController: update method error: ' . $e->getMessage()); // Log error
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified book from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id)
    {
        Log::info('BookController: destroy method called, ID: ' . $id); // Log the method call and ID
        try {
            $book = Book::findOrFail($id);
            $book->delete();
            Log::info('BookController: destroy method successful, book ID: ' . $id); // Log success
            return response()->json(['message' => 'Book deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('BookController: destroy method error: ' . $e->getMessage()); // Log error
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}