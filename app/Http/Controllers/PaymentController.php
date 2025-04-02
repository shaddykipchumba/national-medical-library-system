<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Store a newly created payment record.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('PaymentController: store method called');

        $validator = Validator::make($request->all(), [
            'client_name'  => 'required|string|max:255',
            'client_phone' => 'required|string|max:20',
            'amount_payed' => 'required|numeric|min:0.01',
            // The date_payed is automatically set to the current timestamp in the migration.
        ]);

        if ($validator->fails()) {
            Log::warning('PaymentController: store validation failed: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $payment = Payment::create($validator->validated());
            Log::info('PaymentController: store method successful, payment ID: ' . $payment->id);
            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment
            ], 201);
        } catch (\Exception $e) {
            Log::error('PaymentController: store method error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
