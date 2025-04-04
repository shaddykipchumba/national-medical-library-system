<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('borrow_requests', function (Blueprint $table) {
            // Primary Key (Auto-incrementing Big Integer)
            $table->id();

            // Foreign Key for the Client making the request
            // Assumes 'clients' table exists with an 'id' column
            // cascadeOnDelete: If a Client is deleted, their borrow requests are also deleted.
            $table->foreignId('client_id')
                  ->constrained('clients') // Links to 'id' on 'clients' table
                  ->cascadeOnDelete();

            // Foreign Key for the Book being requested
            // Assumes 'books' table exists with an 'id' column
            // cascadeOnDelete: If a Book is deleted, requests for it are also deleted.
            $table->foreignId('book_id')
                  ->constrained('books') // Links to 'id' on 'books' table
                  ->cascadeOnDelete();

            // Status of the borrow request
            // e.g., 'pending', 'approved', 'rejected', 'cancelled'
            $table->string('status')->default('pending')->index(); // Default to 'pending', add index for faster status lookups

            // requested_at is handled by created_at from timestamps()
            // Add any other relevant fields here, e.g.:
            // $table->timestamp('approved_at')->nullable();
            // $table->timestamp('rejected_at')->nullable();
            // $table->foreignId('approved_by')->nullable()->constrained('users'); // If approved by an Admin (User model)

            // created_at and updated_at timestamp columns
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_requests');
    }
};
