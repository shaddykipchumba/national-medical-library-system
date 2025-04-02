<?php

namespace App\Http\Controllers;

use App\Models\Penalty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PenaltyController extends Controller
{

    public function store(Request $request)
    {
        Log::info('PenaltiesController: store method called');

        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer',
            'book_number_id' => 'required|integer',
            'amount' => 'required|numeric',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            Log::warning('PenaltiesController: store method validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $penalty = Penalty::create($validator->validated());
            Log::info('PenaltiesController: store method successful, penalty ID: ' . $penalty->id);
            return response()->json([
                'message' => 'Penalty created successfully',
                'penalty' => $penalty
            ], 201);
        } catch (\Exception $e) {
            Log::error('PenaltiesController: store method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function getPenalties()
{
    try {
        $penalties = \App\Models\Penalty::all();
        return response()->json(['penalties' => $penalties], 200);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function destroy($id)
{
    $penalty = Penalty::find($id);

    if (!$penalty) {
        return response()->json(['message' => 'Penalty not found'], 404);
    }

    $penalty->delete();
    return response()->json(['message' => 'Penalty removed successfully']);
}
}
