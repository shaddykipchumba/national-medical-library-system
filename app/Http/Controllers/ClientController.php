<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        Log::info('ClientController: index method called');

        try {
            $clients = Client::all();
            Log::info('ClientController: index method successful, found ' . count($clients) . ' clients');
            return response()->json(['clients' => $clients], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: index method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created client in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('ClientController: store method called');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients|max:255',
            'idNumber' => 'required|string|unique:clients|max:20',  // Added validation for ID Number
            'phoneNumber' => 'required|string|max:20',      // Added validation for Phone Number
            'books' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: store method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $client = Client::create($validator->validated());
            Log::info('ClientController: store method successful, client ID: ' . $client->id);
            return response()->json(['message' => 'Client created successfully', 'client' => $client], 201);
        } catch (\Exception $e) {
            Log::error('ClientController: store method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified client.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id)
    {
        Log::info('ClientController: show method called, ID: ' . $id);

        try {
            $client = Client::findOrFail($id);
            Log::info('ClientController: show method successful, client ID: ' . $client->id);
            return response()->json(['client' => $client], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: show method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified client in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id)
    {
        Log::info('ClientController: update method called, ID: ' . $id);

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'email' => 'email|unique:clients,email,' . $id . '|max:255',
            'idNumber' => 'string|unique:clients,idNumber,' . $id . '|max:20', // Added to update
            'phoneNumber' => 'string|max:20',  // Added to update
            'books' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: update method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $client = Client::findOrFail($id);
            $client->update($validator->validated());
            Log::info('ClientController: update method successful, client ID: ' . $client->id);
            return response()->json(['message' => 'Client updated successfully', 'client' => $client], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: update method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified client from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id)
    {
        Log::info('ClientController: destroy method called, ID: ' . $id);

        try {
            $client = Client::findOrFail($id);
            $client->delete();
            Log::info('ClientController: destroy method successful, client ID: ' . $id);
            return response()->json(['message' => 'Client deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: destroy method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Checkin a book from a client.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkin(Request $request, int $id)
    {
        Log::info('ClientController: checkin method called, ID: ' . $id);

        $validator = Validator::make($request->all(), [
            'books' => 'required|array',
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: checkin method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $client = Client::findOrFail($id);
            $client->update(['books' => $validator->validated()['books']]);
            Log::info('ClientController: checkin method successful, client ID: ' . $client->id);
            return response()->json(['message' => 'Book checked in successfully', 'client' => $client], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: checkin method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}