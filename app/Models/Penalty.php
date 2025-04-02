<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penalty extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'client_name',
        'client_phone',
        'date_to_be_returned',
        'days_overdue',
        'fee_amount',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_to_be_returned' => 'datetime',
        'days_overdue'        => 'integer',
        'fee_amount'          => 'decimal:2',
    ];
}
