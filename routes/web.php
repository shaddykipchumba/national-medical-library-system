<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

// --- Controller Imports ---
// API Controllers (mostly for Admin)
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookNumberController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PenaltyController;
use App\Http\Controllers\BorrowRequestController; // Handles both Admin and Client API actions

// Inertia Page Controllers (Web Interface)
use App\Http\Controllers\ClientAreaController; // Handles Client dashboard, my books, library browse, my requests

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

// --- Public Routes ---

Route::get('/', function () {
    // Redirect if already logged in
    if (Auth::guard('client')->check()) {
        return redirect()->route('client.home');
    }
    if (Auth::guard('web')->check()) {
        $user = Auth::user();
        // Redirect admin to their dashboard (ensure route exists or comment out)
        if ($user && ($user->is_admin ?? false)) {
            // return redirect()->route('admin.dashboard'); // Use if you have a specific admin dashboard route
            return redirect()->route('dashboard'); // Or redirect admin to the default dashboard
        }
        // Redirect regular 'web' user if needed
        // return redirect()->route('dashboard');
    }
    // Show welcome page if guest
    return Inertia::render('welcome'); // Matches Welcome.tsx
})->name('home');

// --- Authentication Routes ---
// Handles Login, Registration (Admin/Client), Password Reset, Logout etc.
require __DIR__.'/auth.php';

// --- Admin / Default Authenticated Web Routes ---
// Protected by 'web' guard (User model) and email verification.
// Assumes 'web' guard users with is_admin=true (or role) are Admins.
// Apply specific admin role/permission middleware here if you have one (e.g., ->middleware('admin'))
Route::middleware(['auth:web', 'verified'])->group(function () {

    // Default/Admin Dashboard
    Route::get('/dashboard', function () {
        // This might render a different view based on user role inside the component later
        return Inertia::render('dashboard'); // Renders resources/js/Pages/Dashboard.tsx
    })->name('dashboard');

    // Example Specific Admin Dashboard Route (if needed)
    // Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Admin-facing Inertia Pages (Simple Render)
    Route::get('/books', function () { return Inertia::render('books'); })->name('books'); // Matches Books.tsx
    Route::get('/clients', function () { return Inertia::render('clients'); })->name('clients'); // Matches Clients.tsx
    Route::get('/checkout', function () { return Inertia::render('checkout'); })->name('checkout');
    Route::get('/checkin', function () { return Inertia::render('checkin'); })->name('checkin');
    Route::get('/reports', function () { return Inertia::render('reports'); })->name('reports');
    Route::get('/overdues', function () { return Inertia::render('overdues'); })->name('overdues');
    Route::get('/penalties', function () { return Inertia::render('penalties'); })->name('penalties');

    // Book Details Page (uses controller returning Inertia view)
    Route::get('/books/{id}', [BookNumberController::class, 'details'])->name('books.details');

    // Admin page to view/manage borrow requests (renders Inertia view via controller)
    Route::get('/borrow-requests', [BorrowRequestController::class, 'index'])->name('admin.borrow-requests.index'); // Added Admin page route

    // Add other admin web routes here...
    // Example Settings route if it's admin-only
    // require __DIR__.'/settings.php'; // Move inside admin middleware if needed

});

// --- Client Authenticated Web Routes ---
// Protected by 'client' guard (Client model)
Route::middleware(['auth:client']) // Use the specific 'client' guard
    ->prefix('client')           // URL prefix: /client/...
    ->name('client.')            // Route name prefix: client.
    ->group(function () {

        // Client Dashboard
        Route::get('/dashboard', [ClientAreaController::class, 'dashboard'])->name('home');

        // Client's Borrowed Books Page
        Route::get('/my-books', [ClientAreaController::class, 'myBooks'])->name('books');

        // Client Library Browse Page
        Route::get('/library', [ClientAreaController::class, 'libraryBrowse'])->name('library.browse');

        // Client's Borrow Requests History Page
        Route::get('/my-requests', [ClientAreaController::class, 'myRequests'])->name('requests.index');

        // Add other client web/Inertia routes here (e.g., profile page)
        // Route::get('/profile', [ClientProfileController::class, 'edit'])->name('profile.edit');
});


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Prefix: /api
*/

// --- General / Admin API Routes ---
// Use appropriate middleware (e.g., 'auth:web' + admin role check, or 'auth:sanctum' for tokens)
Route::prefix('api')
    // ->middleware('auth:sanctum') // Example if using token auth for API
    ->middleware(['auth:web']) // Or use session auth for admin SPA, add admin role check middleware
    ->name('api.') // Route name prefix api.
    ->group(function () {

    // Admin API Resources
    Route::apiResource('/books', BookController::class)->names('books');
    Route::apiResource('/book-numbers', BookNumberController::class)->where(['bookNumber' => '[0-9]+'])->names('book-numbers');
    Route::apiResource('/clients', ClientController::class)->names('clients'); // Admin CRUD for clients
    // Admin actions for Borrow Requests (excluding client-specific store/destroy)
    Route::apiResource('/borrow-requests', BorrowRequestController::class)->only(['index', 'show', 'update'])->names('borrow-requests');

    // Specific API actions (mostly for Admin context)
    Route::get('/book-numbers/assigned', [BookNumberController::class, 'getAssigned'])->name('book-numbers.assigned');
    Route::get('/book-numbers/available', [BookNumberController::class, 'getAvailable'])->name('book-numbers.available');
    Route::get('/book-numbers/almost-overdue', [BookNumberController::class, 'getAlmostOverdue'])->name('book-numbers.almost-overdue');
    Route::get('/book-numbers/overdue', [BookNumberController::class, 'getOverdue'])->name('book-numbers.overdue');
    Route::get('/overdues', [BookNumberController::class, 'getOverdue'])->name('overdues'); // Alias
    Route::put('/book-numbers/{bookNumber}/assign', [BookNumberController::class, 'assign'])->name('book-numbers.assign');
    Route::put('/book-numbers/{bookNumber}/collect', [BookNumberController::class, 'collect'])->name('book-numbers.collect');
    Route::put('/clients/{id}/checkin', [ClientController::class, 'checkin'])->name('clients.checkin'); // Review this endpoint
    Route::get('/penalties', [PenaltyController::class, 'getPenalties'])->name('penalties.index');
    Route::post('/penalties', [BookNumberController::class, 'penalize'])->name('penalties.store');
    Route::delete('/penalties/{id}', [PenaltyController::class, 'destroy'])->name('penalties.destroy');
    Route::put('/penalties/refresh', [PenaltyController::class, 'refreshPenalties'])->name('penalties.refresh');
    Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');

    // API endpoint for admins to get available numbers for a specific book
    Route::get('/books/{book}/available-numbers', [BorrowRequestController::class, 'getAvailableForBook']) // Point to BorrowRequestController
         ->name('books.available-numbers');

});

// --- Client Specific API Routes ---
// Use 'auth:client' middleware (session based for the client SPA)
Route::middleware(['auth:client']) // Protect with client session guard
    ->prefix('api')            // Keep '/api' prefix
    ->name('api.client.')      // Route name prefix api.client.
    ->group(function () {

    // Client submits a borrow request
    Route::post('/client/borrow-requests', [BorrowRequestController::class, 'store'])
         ->name('borrow-requests.store'); // api.client.borrow-requests.store

    // Client cancels their own pending borrow request
    Route::delete('/client/borrow-requests/{borrowRequest}', [BorrowRequestController::class, 'destroy'])
          ->name('borrow-requests.destroy'); // api.client.borrow-requests.destroy

    // Add other API endpoints needed ONLY by the logged-in client frontend here

});

// --- Include other route files ---
require __DIR__.'/settings.php'; // Uncomment or move if needed, e.g., inside admin group
require __DIR__.'/auth.php';
