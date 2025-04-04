<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User; // For Admin Registration
use App\Models\Client; // For Client Registration
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Use Auth Facade
use Illuminate\Support\Facades\Hash; // Use Hash Facade
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException; // Import ValidationException if throwing manually
use Inertia\Inertia;
use Inertia\Response;
use App\Providers\RouteServiceProvider; // Import if using RouteServiceProvider::HOME
use Illuminate\Support\Facades\Log; // Import Log facade for debugging

class RegisteredUserController extends Controller
{
    /**
     * ==============================================
     * ADMIN REGISTRATION METHODS
     * ==============================================
     */

    /**
     * Display the ADMIN registration page.
     * Handles route: GET /register (name: register)
     * Renders Inertia view: Auth/Register.tsx (or Auth/Admin/Register.tsx)
     */
    public function create(): Response
    {
        // IMPORTANT: Ensure this Inertia component is the ADMIN registration form.
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming ADMIN registration request.
     * Creates a User record marked as admin.
     * Handles route: POST /register (name: register)
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class, // Unique in 'users' table
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Create Admin User record
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Hash password for User model
            'is_admin' => true, // Set admin flag (ensure 'is_admin' column exists)
            // 'role' => 'admin', // Or set admin role
        ]);

        event(new Registered($user)); // Fire event for the User

        // Optional: Log the admin in automatically?
        // Auth::login($user);

        // Redirect to the admin dashboard
        // IMPORTANT: Ensure the route 'admin.dashboard' exists.
        return to_route('dashboard');
    }


    /**
     * ==============================================
     * CLIENT REGISTRATION METHODS
     * ==============================================
     */

    /**
     * Display the CLIENT registration view.
     * Handles route: GET /client/register (name: client.register)
     * Renders Inertia view: Auth/Client/Register.tsx
     */
    public function createClient(): Response
    {
        return Inertia::render('auth/client/register');
    }

    /**
     * Handle an incoming CLIENT registration request. (REVISED SAVE METHOD)
     * Creates a Client record using the 'hashed' cast in the model.
     * Handles route: POST /client/register (name: client.register)
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function storeClient(Request $request): RedirectResponse
    {
        // 1. Validation
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'idNumber' => 'required|string|max:255|unique:clients,idNumber', // Unique in 'clients' table
            'phoneNumber' => 'required|string|max:20',
            'email' => 'required|string|lowercase|email|max:255|unique:clients,email', // Unique in 'clients' table
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        Log::info('Client Registration: Validation Passed.', $validatedData);

        try {
            // --- SAVE APPROACH RELYING ON 'hashed' CAST ---
            // 2. Instantiate new Client model
            $client = new Client();

            // 3. Set properties directly from validated data
            $client->name = $validatedData['name'];
            $client->idNumber = $validatedData['idNumber'];
            $client->phoneNumber = $validatedData['phoneNumber'];
            $client->email = $validatedData['email'];
            // --- Assign the PLAIN password ---
            // The 'hashed' cast in the Client model should hash this upon saving.
            $client->password = $validatedData['password'];
            $client->status = 'active'; // Example default status

            // Log before save, make password visible for debugging only if needed
            // Log::info('Client Registration: Client object prepared (plain pwd).', $client->makeVisible(['password'])->toArray());

            // 4. Save the new Client record (triggers 'hashed' cast for password)
            $saved = $client->save();

            if (!$saved) {
                 Log::error('Client Registration: Failed to save client model.');
                 return back()->withErrors(['error' => 'Registration failed. Please try again.']);
            }

            Log::info('Client Registration: Client saved successfully.', ['id' => $client->id]);
            // --- END SAVE APPROACH ---

            // 5. Fire Event (Client model must be Authenticatable)
            event(new Registered($client));

            // 6. Log the new client in using the 'client' guard
            Auth::guard('client')->login($client);

            // 7. Redirect client to their standard dashboard
            // Ensure 'dashboard' named route is appropriate for clients, or use 'client.home'
            return to_route('client.home');

        } catch (\Exception $e) {
            // Log any exception during the process
            Log::error('Client Registration: Exception caught.', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Log full trace for detailed debugging
            ]);
            // Return a generic error message back to the registration form
             return back()->withErrors(['error' => 'An unexpected error occurred during registration. Please try again later.']);
        }
    }
}
