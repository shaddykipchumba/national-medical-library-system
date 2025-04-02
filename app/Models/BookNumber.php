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
        'assigned_to',
        'date_to_be_returned',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}