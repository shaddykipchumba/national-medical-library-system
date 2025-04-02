<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'idNumber',
        'phoneNumber',
        'email',
        'status',
        'books',
    ];

    protected $casts = [
        'books' => 'array',
    ];
}