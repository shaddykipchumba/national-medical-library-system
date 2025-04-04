<?php

namespace App\Http\Controllers;

use App\Models\Client; // Use the Client model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash; // Import Hash Facade
use Illuminate\Validation\Rules;    // Import Rules for password validation
use Illuminate\Database\Eloquent\ModelNotFoundException; // Import specific exception for cleaner catches
use Illuminate\Http\JsonResponse; // Import JsonResponse type hint

class ClientController extends Controller
{
    /**
     * Display a listing of the clients with borrowed book counts. (For Admin Interface)
     * Handles: GET /api/clients
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        Log::info('ClientController: index method called');
        try {
            // Eager load the count of borrowed book numbers for each client
            $clients = Client::withCount('borrowedBookNumbers') // Use the relationship name from Client model
                         ->latest() // Optional: Order by newest first
                         ->get(); // Use get() when using withCount

            // The count is available as $client->borrowed_book_numbers_count

            Log::info('ClientController: index method successful, found ' . count($clients) . ' clients');
            // Return clients (password is hidden by model's $hidden property)
            return response()->json(['clients' => $clients], 200);
        } catch (\Exception $e) {
            Log::error('ClientController: index method error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve clients.'], 500);
        }
    }

    /**
     * Store a newly created client in storage. (Handles Admin Adding Client)
     * Handles: POST /api/clients
     * Uses manual instantiation and save() for robust password handling.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('ClientController: store method called', $request->all());

        // 1. Validation (Includes password from frontend default)
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'idNumber' => 'required|string|max:255|unique:clients,idNumber',
            'phoneNumber' => 'required|string|max:20',
            'email' => 'required|string|lowercase|email|max:255|unique:clients,email',
            'password' => ['required', 'string', Rules\Password::min(4)], // Validate default password
            // Add validation for 'status' or 'books' if they can be sent during creation
            'status' => 'sometimes|string|in:active,inactive,suspended', // Example status validation
            'books' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: store method validation failed: ', $validator->errors()->toArray());
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();
        Log::info('ClientController: Validation Passed.', $validatedData);

        try {
            // --- Use new Client() and save() ---
            $client = new Client();
            $client->name = $validatedData['name'];
            $client->idNumber = $validatedData['idNumber'];
            $client->phoneNumber = $validatedData['phoneNumber'];
            $client->email = $validatedData['email'];
            $client->status = $validatedData['status'] ?? 'active'; // Set default status
            $client->books = $validatedData['books'] ?? []; // Set default books array if needed

            // Hash and assign password directly to the property
            $client->password = Hash::make($validatedData['password']);

            Log::info('ClientController: Attempting to save client object:', $client->toArray());

            // Save the model instance
            $saved = $client->save();

            if (!$saved) {
                 Log::error('ClientController: Failed to save client model using save().');
                 return response()->json(['message' => 'Failed to save client information.'], 500);
            }
            // --- END new/save APPROACH ---

            Log::info('ClientController: store method successful, client ID: ' . $client->id);
            // Return the newly created client data (password will be hidden)
            return response()->json(['message' => 'Client created successfully', 'client' => $client], 201);

        } catch (\Exception $e) {
             Log::error('ClientController: store method error: ', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Log full trace
            ]);
            return response()->json(['message' => 'Failed to create client due to a server error.'], 500);
        }
    }

    /**
     * Display the specified client. (Likely for Admin)
     * Handles: GET /api/clients/{id}
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        Log::info('ClientController: show method called, ID: ' . $id);
        try {
            // Consider adding withCount here too if needed on detail view
            $client = Client::findOrFail($id);
            Log::info('ClientController: show method successful, client ID: ' . $client->id);
            return response()->json(['client' => $client], 200);
        } catch (ModelNotFoundException $e) {
             Log::warning('ClientController: show method client not found: ID ' . $id);
             return response()->json(['message' => 'Client not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ClientController: show method error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve client.'], 500);
        }
    }

    /**
     * Update the specified client in storage. (Likely for Admin)
     * Handles: PUT /api/clients/{id}
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        Log::info('ClientController: update method called, ID: ' . $id, $request->except('password'));

        // Exclude password from general updates
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'idNumber' => 'sometimes|required|string|max:255|unique:clients,idNumber,' . $id,
            'phoneNumber' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|string|lowercase|email|max:255|unique:clients,email,' . $id,
            'status' => 'sometimes|required|string|in:active,inactive,suspended', // Example status update
            'books' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: update method validation failed: ', $validator->errors()->toArray());
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $client = Client::findOrFail($id);
            $updated = $client->update($validator->validated());

             if (!$updated) {
                 Log::error('ClientController: Failed to update client model using update().', ['id' => $id]);
                 return response()->json(['message' => 'Failed to update client information.'], 500);
            }

            Log::info('ClientController: update method successful, client ID: ' . $client->id);
            // Return updated client data using fresh() to get updated attributes
            return response()->json(['message' => 'Client updated successfully', 'client' => $client->fresh()], 200);
         } catch (ModelNotFoundException $e) {
             Log::warning('ClientController: update method client not found: ID ' . $id);
             return response()->json(['message' => 'Client not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ClientController: update method error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update client.'], 500);
        }
    }

    /**
     * Remove the specified client from storage. (Likely for Admin)
     * Handles: DELETE /api/clients/{id}
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        Log::info('ClientController: destroy method called, ID: ' . $id);
        try {
            $client = Client::findOrFail($id);
            $deleted = $client->delete();

             if (!$deleted) {
                 Log::error('ClientController: Failed to delete client model.', ['id' => $id]);
                 return response()->json(['message' => 'Failed to delete client.'], 500);
            }

            Log::info('ClientController: destroy method successful, client ID: ' . $id);
            return response()->json(['message' => 'Client deleted successfully'], 200); // Or use 204 No Content response()->noContent();
         } catch (ModelNotFoundException $e) {
             Log::warning('ClientController: destroy method client not found: ID ' . $id);
             return response()->json(['message' => 'Client not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ClientController: destroy method error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete client.'], 500);
        }
    }

    /**
     * Checkin a book from a client. (Placeholder/Review Needed)
     * Handles: PUT /api/clients/{id}/checkin
     * Consider moving this to a more appropriate controller (e.g., BookNumberController or BorrowingController)
     */
    public function checkin(Request $request, int $id): JsonResponse
    {
        Log::info('ClientController: checkin method called, Client ID: ' . $id, $request->all());

        // This logic likely needs to change to update BookNumber status instead
        $validator = Validator::make($request->all(), [
            'books' => 'required|array', // Current validation expects replacing the whole list
        ]);

        if ($validator->fails()) {
            Log::warning('ClientController: checkin method validation failed: ', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $client = Client::findOrFail($id);
            // WARNING: Review this update logic carefully.
            $client->update(['books' => $validator->validated()['books']]);
            Log::info('ClientController: checkin method successful, client ID: ' . $client->id);
            return response()->json(['message' => 'Client book list updated (Checkin simulation)', 'client' => $client], 200);
         } catch (ModelNotFoundException $e) {
             Log::warning('ClientController: checkin method client not found: ID ' . $id);
             return response()->json(['message' => 'Client not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ClientController: checkin method error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update client books.'], 500);
        }
    }
}
