<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Import BelongsTo relationship type

/**
 * App\Models\BorrowRequest
 *
 * Represents a request made by a Client to borrow a specific Book.
 * Typically managed by an Administrator.
 */
class BorrowRequest extends Model
{
    use HasFactory; // Automatically added by make:model

    /**
     * The attributes that are mass assignable.
     *
     * These fields can be filled when using methods like Model::create().
     * 'status' is included here assuming you might want to set it during creation,
     * otherwise the database default ('pending') will be used.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'client_id', // The ID of the Client making the request
        'book_id',   // The ID of the Book being requested
        'status',    // The current status (e.g., 'pending', 'approved', 'rejected')
        // 'requested_at' is usually handled by timestamps() automatically as 'created_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // Define any casts if needed, e.g., for status if using enums
        // 'requested_at' => 'datetime', // If you have a separate requested_at column
    ];

    /**
     * Get the client associated with the borrow request.
     * Defines the inverse of a one-to-many relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function client(): BelongsTo
    {
        // Assumes the foreign key in borrow_requests table is 'client_id'
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Get the book associated with the borrow request.
     * Defines the inverse of a one-to-many relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function book(): BelongsTo
    {
        // Assumes the foreign key in borrow_requests table is 'book_id'
        return $this->belongsTo(Book::class, 'book_id');
    }
}
