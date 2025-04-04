<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminLoginController extends Controller
{
    /**
     * Show the admin login form.
     *
     * @return \Illuminate\View\View
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/AdminLogin'); // Assuming you have an AdminLogin.vue component
    }

    /**
     * Handle an admin login request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Check if the user is an admin (you'll need to implement this logic)
            if ($this->isAdmin(Auth::user())) {
                return redirect()->intended('/admin/dashboard'); // Redirect to admin dashboard
            } else {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return back()->withErrors([
                    'email' => 'You do not have admin privileges.',
                ]);
            }

        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    /**
     * Log the admin user out.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/'); // Redirect to the welcome page
    }

    /**
     * Check if the user is an admin.
     *
     * @param  mixed  $user
     * @return bool
     */
    private function isAdmin($user)
    {
        // Implement your admin check logic here.
        // For example, check a role or a specific field in the user table.
        // Example using a 'role' column:
        return $user->role === 'admin';

        // Example using a pivot table for roles:
        // return $user->roles()->where('name', 'admin')->exists();

        // Or you might have an 'is_admin' boolean field:
        // return $user->is_admin;

        // Replace this with your actual admin check logic.
    }
}
