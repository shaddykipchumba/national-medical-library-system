<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
// Import the base Authenticatable class to extend
use Illuminate\Foundation\Auth\User as Authenticatable;
// Import Notifiable trait for potential email notifications
use Illuminate\Notifications\Notifiable;
// Import BookNumber model for the relationship
use App\Models\BookNumber;

/**
 * App\Models\Client
 *
 * Represents a client user who can log in and borrow books.
 * Configured to be used with Laravel's authentication system via the 'client' guard.
 */
class Client extends Authenticatable // Extends Authenticatable for login capabilities
{
    use HasFactory, Notifiable; // Include standard traits

    /**
     * The database table associated with the model.
     *
     * Explicitly defining the table is good practice, especially if
     * the table name isn't the standard plural form of the model name.
     * Laravel usually infers 'clients' automatically from 'Client'.
     *
     * @var string
     */
    // protected $table = 'clients'; // Uncomment if your table name is different

    /**
     * The guard associated with the model.
     * Helps Laravel know which guard to use by default for this model.
     *
     * @var string
     */
    protected $guard = 'client'; // Associate with the 'client' guard

    /**
     * The attributes that are mass assignable.
     *
     * IMPORTANT: 'password' is NOT included here for security (prevents mass assignment).
     * It should be set explicitly or rely on the 'hashed' cast during assignment.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'idNumber',
        'phoneNumber',
        'email',
        'status', // e.g., 'active', 'inactive', 'suspended'
        'books',  // Stores data about currently borrowed books (structure depends on usage)
    ];

    /**
     * The attributes that should be hidden for serialization.
     * Prevents sensitive information like passwords from being included in JSON responses.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token', // Required for "remember me" functionality
    ];

    /**
     * The attributes that should be cast.
     * Ensures data types are correct when accessing model attributes.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // Casts the 'books' attribute to a PHP array when accessed/set
        'books' => 'array',
        // Casts 'email_verified_at' to a Carbon datetime object (needed for Authenticatable/MustVerifyEmail)
        'email_verified_at' => 'datetime',
        // Automatically hashes the password when it is set on the model instance before saving
        'password' => 'hashed',
    ];

    /**
     * Define the relationship to the BookNumbers currently assigned (borrowed) by this client.
     *
     * This relationship is used, for example, in the ClientController@index
     * with withCount('borrowedBookNumbers') to get the number of borrowed books.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function borrowedBookNumbers()
    {
        // Assumes 'assigned_to' column in 'book_numbers' table stores the client's ID,
        // and 'assigned' is the status indicating a borrowed book.
        return $this->hasMany(BookNumber::class, 'assigned_to')->where('status', 'assigned');
    }

    /*
     * If using the 'hashed' cast for the password attribute,
     * you typically don't need a manual setPasswordAttribute mutator.
     * The Authenticatable contract methods (like getAuthPassword)
     * are inherited from Illuminate\Foundation\Auth\User.
     */
}
