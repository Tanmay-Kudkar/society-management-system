package com.society.backend.finance.controller;

import com.society.backend.finance.dto.request.*;
import com.society.backend.finance.dto.response.*;
import com.society.backend.finance.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.society.backend.finance.entity.Payment;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create a Razorpay order for payment
     */
    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        CreateOrderResponse response = paymentService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Verify payment after successful Razorpay checkout
     */
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        PaymentResponse response = paymentService.verifyAndCapturePayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Handle payment failure
     */
    @PostMapping("/failure")
    public ResponseEntity<PaymentResponse> handleFailure(
            @RequestParam Long paymentId,
            @RequestParam(required = false) String errorCode,
            @RequestParam(required = false) String errorDescription) {
        PaymentResponse response = paymentService.handlePaymentFailure(paymentId, errorCode, errorDescription);
        return ResponseEntity.ok(response);
    }

    /**
     * Get payment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    /**
     * Get payment by Razorpay order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable String orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    /**
     * Get all payments for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }

    /**
     * Get all payments for a society
     */
    @GetMapping("/society/{societyId}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')")
    public ResponseEntity<List<PaymentResponse>> getPaymentsBySociety(@PathVariable Long societyId) {
        return ResponseEntity.ok(paymentService.getPaymentsBySociety(societyId));
    }

    /**
     * Get all payments for a maintenance bill
     */
    @GetMapping("/bill/{billId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByBill(@PathVariable Long billId) {
        return ResponseEntity.ok(paymentService.getPaymentsByMaintenanceBill(billId));
    }

    /**
     * Razorpay webhook handler (for async payment notifications)
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        // TODO: Implement webhook verification and handling
        // This is for handling async events like payment.captured, payment.failed, etc.
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
