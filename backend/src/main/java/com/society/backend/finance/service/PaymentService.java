package com.society.backend.finance.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.society.backend.common.config.RazorpayConfig;
import com.society.backend.finance.dto.request.*;
import com.society.backend.finance.dto.response.*;
import com.society.backend.common.exception.ResourceNotFoundException;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.finance.repository.PaymentRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.finance.service.MaintenanceBillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.society.backend.finance.entity.MaintenanceBill;
import com.society.backend.finance.entity.Payment;
import com.society.backend.flat.entity.Flat;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final MaintenanceBillService maintenanceBillService;

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        try {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            // Razorpay expects amount in paise (smallest currency unit)
            orderRequest.put("amount", request.getAmount().multiply(BigDecimal.valueOf(100)).intValue());
            orderRequest.put("currency", razorpayConfig.getCurrency());
            orderRequest.put("receipt", "rcpt_" + UUID.randomUUID().toString().substring(0, 8));
            
            // Add notes for reference
            JSONObject notes = new JSONObject();
            notes.put("user_id", user.getId().toString());
            if (request.getMaintenanceBillId() != null) {
                notes.put("maintenance_bill_id", request.getMaintenanceBillId().toString());
            }
            notes.put("payment_type", request.getPaymentType());
            orderRequest.put("notes", notes);

            Order order = razorpayClient.orders.create(orderRequest);

            // Create payment record in database
            Payment payment = new Payment();
            payment.setRazorpayOrderId(order.get("id"));
            payment.setAmount(request.getAmount());
            payment.setCurrency(razorpayConfig.getCurrency());
            payment.setStatus("CREATED");
            payment.setPaymentType(request.getPaymentType());
            payment.setDescription(request.getDescription());
            payment.setReceiptNumber(order.get("receipt"));
            payment.setUser(user);

            if (user.getSociety() != null) {
                payment.setSociety(user.getSociety());
            }

            if (request.getMaintenanceBillId() != null) {
                MaintenanceBill bill = maintenanceBillRepository.findById(request.getMaintenanceBillId())
                        .orElseThrow(() -> new ResourceNotFoundException("Maintenance bill not found"));
                payment.setMaintenanceBill(bill);
                
                // Get society from bill, or from flat if bill's society is null
                if (bill.getSociety() != null) {
                    payment.setSociety(bill.getSociety());
                } else if (bill.getFlat() != null && bill.getFlat().getSociety() != null) {
                    payment.setSociety(bill.getFlat().getSociety());
                }
            }

            Payment savedPayment = paymentRepository.save(payment);

            return CreateOrderResponse.builder()
                    .orderId(order.get("id"))
                    .amount(request.getAmount())
                    .currency(razorpayConfig.getCurrency())
                    .keyId(razorpayConfig.getKeyId())
                    .receipt(order.get("receipt"))
                    .description(request.getDescription())
                    .paymentId(savedPayment.getId())
                    .customerName(user.getName())
                    .customerEmail(user.getEmail())
                    .customerPhone(user.getPhone())
                    .build();

        } catch (RazorpayException e) {
            log.error("Error creating Razorpay order: {}", e.getMessage());
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentResponse verifyAndCapturePayment(VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        // Verify signature
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayConfig.getKeySecret());

            if (!isValid) {
                payment.setStatus("FAILED");
                payment.setErrorDescription("Invalid payment signature");
                paymentRepository.save(payment);
                throw new RuntimeException("Payment verification failed: Invalid signature");
            }

            // Update payment record
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setStatus("CAPTURED");
            payment.setPaidAt(LocalDateTime.now());

            // Fetch payment details from Razorpay to get payment method
            try {
                com.razorpay.Payment razorpayPayment = razorpayClient.payments.fetch(request.getRazorpayPaymentId());
                payment.setPaymentMethod(razorpayPayment.get("method"));
            } catch (RazorpayException e) {
                log.warn("Could not fetch payment details: {}", e.getMessage());
            }

            Payment savedPayment = paymentRepository.save(payment);

            // Update maintenance bill if linked - use recordOnlinePayment to bypass role check
            if (payment.getMaintenanceBill() != null) {
                maintenanceBillService.recordOnlinePayment(
                        payment.getMaintenanceBill().getId(),
                        payment.getAmount(),
                        "RAZORPAY",
                        request.getRazorpayPaymentId(),
                        payment.getUser().getId()
                );
            }

            return mapToResponse(savedPayment);

        } catch (RazorpayException e) {
            log.error("Error verifying payment: {}", e.getMessage());
            payment.setStatus("FAILED");
            payment.setErrorCode("VERIFICATION_FAILED");
            payment.setErrorDescription(e.getMessage());
            paymentRepository.save(payment);
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentResponse handlePaymentFailure(Long paymentId, String errorCode, String errorDescription) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        payment.setStatus("FAILED");
        payment.setErrorCode(errorCode);
        payment.setErrorDescription(errorDescription);

        return mapToResponse(paymentRepository.save(payment));
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
        return mapToResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsBySociety(Long societyId) {
        return paymentRepository.findBySocietyIdOrderByCreatedAtDesc(societyId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByMaintenanceBill(Long billId) {
        return paymentRepository.findByMaintenanceBillId(billId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentType(payment.getPaymentType())
                .paymentMethod(payment.getPaymentMethod())
                .description(payment.getDescription())
                .receiptNumber(payment.getReceiptNumber())
                .maintenanceBillId(payment.getMaintenanceBill() != null ? payment.getMaintenanceBill().getId() : null)
                .userId(payment.getUser() != null ? payment.getUser().getId() : null)
                .userName(payment.getUser() != null ? payment.getUser().getName() : null)
                .societyId(payment.getSociety() != null ? payment.getSociety().getId() : null)
                .societyName(payment.getSociety() != null ? payment.getSociety().getName() : null)
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .errorCode(payment.getErrorCode())
                .errorDescription(payment.getErrorDescription())
                .build();
    }
}
