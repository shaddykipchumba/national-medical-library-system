<?php

namespace App\Http\Controllers\Auth; // Place it within the Auth namespace

use App\Http\Controllers\Controller;
// Remove LoginRequest as it's tied to the default guard by default
// use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider; // Keep if HOME is used as a fallback, otherwise optional
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Use the Auth facade
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException; // Import for throwing login errors
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles authentication for CLIENT users using the 'client' guard.
 */
class ClientLoginController extends Controller
{
    /**
     * Display the CLIENT login view using Inertia.
     */
    public function create(Request $request): Response
    {
        // Renders the Inertia component for client login.
        // Ensure path matches your frontend component, e.g., Auth/Client/Login.tsx
        return Inertia::render('auth/client/login', [ // Corrected component path
            // Adjust password request route name if clients have a separate one (e.g., 'client.password.request')
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming CLIENT authentication request.
     * Authenticates using the 'client' guard and redirects to 'client.home'.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse // Removed LoginRequest type hint
    {
        // 1. Validate the incoming request data
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 2. Attempt to authenticate using the 'client' guard
        if (! Auth::guard('client')->attempt($credentials, $request->boolean('remember'))) {
            // Authentication failed...
            throw ValidationException::withMessages([
                'email' => __('auth.failed'), // Use standard localization key
            ]);
        }

        // 3. Regenerate the session ID for the client guard's session
        $request->session()->regenerate();

        // 4. Redirect CLIENT to their specific home/dashboard route using standard redirect.
        // Inertia frontend will intercept this and perform client-side navigation.
        // IMPORTANT: Ensure you have a route defined with the name 'client.home'
        return redirect()->intended(route('client.home')); // ****** REDIRECT TO client.home ******
    }

    /**
     * Destroy an authenticated session (CLIENT logout).
     * This method will be called by the '/client/logout' route.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // --- Log out using the CORRECT 'client' guard ---
        Auth::guard('client')->logout(); // ****** USE client GUARD ******

        // Invalidate the session
        $request->session()->invalidate();

        // Regenerate CSRF token
        $request->session()->regenerateToken();

        // Standard redirect to homepage, handled by Inertia.
        return redirect('/');
    }
}
