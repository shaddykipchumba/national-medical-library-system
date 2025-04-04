<?php

namespace App\Http\Controllers\Auth; // Standard namespace

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

/**
 * =========================================================================
 * IMPORTANT: Based on the desired setup, this controller now handles
 * ADMIN Login (via the original /login route) and
 * ADMIN Logout (via the original /logout route).
 * =========================================================================
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * Display the ADMIN login view.
     */
    public function create(Request $request): Response
    {
        // Renders the Inertia component at 'resources/js/Pages/Auth/Login.tsx'
        // This component should now be designed as the ADMIN login form.
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'), // Check if admin password reset is enabled
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming ADMIN authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Authenticates the user based on the request.
        // !! IMPORTANT !! You might need to add checks here to ensure
        // the authenticated user IS actually an admin, e.g.:
        // if (! $request->user()->isAdmin()) { Auth::logout(); /* throw error */ }
        $request->authenticate();

        $request->session()->regenerate();

        // Redirect ADMIN to their intended dashboard.
        // You might want to change 'dashboard' to 'admin.dashboard'
        // return redirect()->intended(route('admin.dashboard', absolute: false));
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session (ADMIN logout).
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Logs out the admin using the 'web' guard
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect admin to homepage after logout
        return redirect('/');
    }
}
