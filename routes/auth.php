<?php

// Controller for ADMIN login/logout (Original Controller)
use App\Http\Controllers\Auth\AuthenticatedSessionController;
// Controller for CLIENT login/logout (NEW Controller)
use App\Http\Controllers\Auth\ClientLoginController;
// Controller handling BOTH Admin & Client Registration (Using different methods)
use App\Http\Controllers\Auth\RegisteredUserController;

// Other standard Auth controllers
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;

use Illuminate\Support\Facades\Route;

// === Routes for Guests (Not Logged In) ===
Route::middleware('guest')->group(function () {

    // --- Administrator Registration ---
    // Uses original methods, now designated for Admins
    Route::get('register', [RegisteredUserController::class, 'create']) // Original 'create' method
               ->name('register'); // Original 'register' name (now Admin)
    Route::post('register', [RegisteredUserController::class, 'store']); // Original 'store' method

    // --- Client Registration ---
    // Uses new methods
    Route::get('client/register', [RegisteredUserController::class, 'createClient']) // New 'createClient' method
               ->name('client.register'); // New 'client.register' name
    Route::post('client/register', [RegisteredUserController::class, 'storeClient']); // New 'storeClient' method

    // --- Administrator Login ---
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    // --- Client Login ---
    Route::get('client/login', [ClientLoginController::class, 'create'])->name('client.login');
    Route::post('client/login', [ClientLoginController::class, 'store']);

    // --- Password Reset (Common) ---
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});


// === Routes for Authenticated Users ===
Route::middleware('auth')->group(function () { // Default 'auth' guard

    // --- Email Verification (Typically Clients) ---
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
            ->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
            ->middleware('throttle:6,1')->name('verification.send');

    // --- Password Confirmation (Common) ---
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // --- Administrator Logout ---
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout'); // Admin logout

    // --- Client Logout ---
    Route::post('client/logout', [ClientLoginController::class, 'destroy'])->name('client.logout');

}); // End of 'auth' middleware group
