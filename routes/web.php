<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookNumberController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PaymentController; // For payment processing
use App\Http\Controllers\PenaltyController;

/*
|--------------------------------------------------------------------------
| Inertia Routes
|--------------------------------------------------------------------------
|
| These routes return Inertia responses. They are wrapped in the "auth"
| and "verified" middleware as needed.
|
*/

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('books', function () {
        return Inertia::render('books');
    })->name('books');

    Route::get('clients', function () {
        return Inertia::render('clients');
    })->name('clients');

    Route::get('checkout', function () {
        return Inertia::render('checkout');
    })->name('checkout');

    Route::get('checkin', function () {
        return Inertia::render('checkin');
    })->name('checkin');

    Route::get('reports', function () {
        return Inertia::render('reports');
    })->name('reports');

    // Overdues Inertia Route
    Route::get('overdues', function () {
        return Inertia::render('overdues');
    })->name('overdues');

    Route::get('penalties', function () {
        return Inertia::render('penalties');
    })->name('penalties');

    // Book details page using Inertia + BookNumberController
    Route::get('books/{id}', [BookNumberController::class, 'details'])->name('books.details');
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are prefixed with /api and use the "api" middleware group.
| They serve as backend endpoints for your application.
|
*/

Route::prefix('api')->middleware('api')->group(function () {
    // Books API Routes
    Route::resource('/books', BookController::class)->names([
        'index'   => 'api.books.index',
        'store'   => 'api.books.store',
        'show'    => 'api.books.show',
        'update'  => 'api.books.update',
        'destroy' => 'api.books.destroy',
    ]);

    // Report API Routes
    Route::get('/book-numbers/assigned', [BookNumberController::class, 'getAssigned'])->name('api.book-numbers.assigned');
    Route::get('/book-numbers/available', [BookNumberController::class, 'getAvailable'])->name('api.book-numbers.available');
    Route::get('/book-numbers/almost-overdue', [BookNumberController::class, 'getAlmostOverdue'])->name('api.book-numbers.almost-overdue');
    Route::get('/book-numbers/overdue', [BookNumberController::class, 'getOverdue'])->name('api.book-numbers.overdue');
    Route::get('/overdues', [BookNumberController::class, 'getOverdue'])->name('api.overdues.index');

    // Book Numbers API Routes
    Route::resource('/book-numbers', BookNumberController::class)
        ->where(['bookNumber' => '[0-9]+'])
        ->names([
            'index'   => 'api.book-numbers.index',
            'store'   => 'api.book-numbers.store',
            'show'    => 'api.book-numbers.show',
            'update'  => 'api.book-numbers.update',
            'destroy' => 'api.book-numbers.destroy',
        ]);

    // Assign & Collect Book Numbers
    Route::put('/book-numbers/{bookNumber}/assign', [BookNumberController::class, 'assign'])->name('api.book-numbers.assign');
    Route::put('/book-numbers/{bookNumber}/collect', [BookNumberController::class, 'collect'])->name('api.book-numbers.collect');

    // Clients API Routes
    Route::resource('/clients', ClientController::class)->names([
        'index'   => 'api.clients.index',
        'store'   => 'api.clients.store',
        'show'    => 'api.clients.show',
        'update'  => 'api.clients.update',
        'destroy' => 'api.clients.destroy',
    ]);

    // Checkin API Route
    Route::put('/clients/{id}/checkin', [ClientController::class, 'checkin'])->name('api.clients.checkin');

    // Penalties API Routes
    Route::get('/penalties', [PenaltyController::class, 'getPenalties'])->name('api.penalties.index');
    Route::post('/penalties', [BookNumberController::class, 'penalize'])->name('api.penalties.store');
    Route::delete('/penalties/{id}', [PenaltyController::class, 'destroy'])->name('api.penalties.destroy');

    // NEW: Refresh penalties based on overdue days and update amounts
    Route::put('/penalties/refresh', [PenaltyController::class, 'refreshPenalties'])->name('api.penalties.refresh');

    // Payments API Route
    Route::post('/payments', [PaymentController::class, 'store'])->name('api.payments.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
