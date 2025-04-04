<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookNumber extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'book_number',
        'status',
        'assigned_to', // Holds the ID of the borrower (Client or User)
        'date_to_be_returned',
    ];

    // Existing relationship to the main Book details
    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    // --- IMPORTANT: Decide which relationship to use based on assigned_to ---

    // Original relationship (if assigned_to links to User model)
    // public function assignedUser()
    // {
    //     return $this->belongsTo(User::class, 'assigned_to');
    // }

    // ****** NEW/ALTERNATIVE: Relationship if assigned_to links to Client model ******
    public function assignedClient()
    {
        return $this->belongsTo(Client::class, 'assigned_to');
    }

    // You might need logic elsewhere to determine which relationship to use,
    // or ensure 'assigned_to' *only* ever holds Client IDs if clients are the only borrowers.
}
