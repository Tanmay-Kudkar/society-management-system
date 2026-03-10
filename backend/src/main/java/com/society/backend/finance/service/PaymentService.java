package com.society.backend.finance.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.society.backend.common.config.RazorpayConfig;
import com.society.backend.finance.dto.request.*;
import com.society.backend.finance.dto.response.*;
import com.society.backend.common.exception.ApiException;
import com.society.backend.common.exception.ResourceNotFoundException;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.finance.repository.PaymentRepository;
import com.society.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.stream.Collectors;

import com.society.backend.finance.entity.MaintenanceBill;
import com.society.backend.finance.entity.Payment;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final long UNDO_WINDOW_MINUTES = 30;

    private final Optional<RazorpayClient> razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final MaintenanceBillService maintenanceBillService;

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        RazorpayClient client = requireRazorpayClient();
        try {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            // Razorpay expects amount in paise (smallest currency unit)
            orderRequest.put("amount", request.getAmount().multiply(BigDecimal.valueOf(100)).longValue());
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

            Order order = client.orders.create(orderRequest);

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
        RazorpayClient client = requireRazorpayClient();
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if ("CAPTURED".equals(payment.getStatus())) {
            return mapToResponse(payment);
        }

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
                com.razorpay.Payment razorpayPayment = client.payments.fetch(request.getRazorpayPaymentId());
                payment.setPaymentMethod(razorpayPayment.get("method"));
            } catch (RazorpayException e) {
                log.warn("Could not fetch payment details: {}", e.getMessage());
            }

            Payment savedPayment = paymentRepository.save(payment);
            applyMaintenanceBillPaymentIfNeeded(savedPayment, request.getRazorpayPaymentId());
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
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if ("CAPTURED".equals(payment.getStatus())) {
            return mapToResponse(payment);
        }

        payment.setStatus("FAILED");
        payment.setErrorCode(errorCode);
        payment.setErrorDescription(errorDescription);

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse handlePaymentCancelled(Long paymentId, String reason) {
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if ("CAPTURED".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus()) || "REFUNDED".equals(payment.getStatus())) {
            return mapToResponse(payment);
        }

        payment.setStatus("CANCELLED");
        payment.setErrorCode("CHECKOUT_CANCELLED");
        payment.setErrorDescription(StringUtils.hasText(reason) ? reason : "Payment cancelled by user");

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public Map<String, String> handleWebhook(String payload, String signature) {
        if (!StringUtils.hasText(razorpayConfig.getWebhookSecret())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Razorpay webhook secret is not configured. Set RAZORPAY_WEBHOOK_SECRET.");
        }

        boolean isValid;
        try {
            isValid = Utils.verifyWebhookSignature(payload, signature, razorpayConfig.getWebhookSecret());
        } catch (RazorpayException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to verify webhook signature");
        }
        if (!isValid) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
        }

        JSONObject eventObject = new JSONObject(payload);
        String event = eventObject.optString("event", "");
        JSONObject eventPayload = eventObject.optJSONObject("payload");

        switch (event) {
            case "payment.captured" -> handlePaymentCapturedWebhook(eventPayload);
            case "payment.authorized" -> handlePaymentAuthorizedWebhook(eventPayload);
            case "payment.failed" -> handlePaymentFailedWebhook(eventPayload);
            case "payment.refunded" -> handlePaymentRefundedWebhook(eventPayload);
            case "order.paid" -> handleOrderPaidWebhook(eventPayload);
            default -> {
                log.debug("Unhandled Razorpay webhook event: {}", event);
                return Map.of("status", "ignored", "event", event);
            }
        }

        return Map.of("status", "processed", "event", event);
    }

    @Transactional
    public void deletePayment(Long id, Long deletedByUserId) {
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        payment.setDeletedAt(LocalDateTime.now());
        payment.setDeletedBy(deletedByUserId);
        paymentRepository.save(payment);
    }

    @Transactional
    public PaymentResponse undoDeletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (payment.getDeletedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment is not deleted");
        }

        LocalDateTime undoExpiry = payment.getDeletedAt().plusMinutes(UNDO_WINDOW_MINUTES);
        if (LocalDateTime.now().isAfter(undoExpiry)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Undo window expired for this payment");
        }

        payment.setDeletedAt(null);
        payment.setDeletedBy(null);
        return mapToResponse(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getDeletedPaymentsBySociety(Long societyId) {
        return paymentRepository.findBySocietyIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(societyId)
                .stream()
                .map(this::mapToResponse)
                .filter(PaymentResponse::getUndoAvailable)
                .collect(Collectors.toList());
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByRazorpayOrderIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
        return mapToResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsBySociety(Long societyId) {
        return paymentRepository.findBySocietyIdAndDeletedAtIsNullOrderByCreatedAtDesc(societyId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByMaintenanceBill(Long billId) {
        return paymentRepository.findByMaintenanceBillIdAndDeletedAtIsNull(billId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RazorpayClient requireRazorpayClient() {
        if (razorpayClient.isPresent()
                && StringUtils.hasText(razorpayConfig.getKeyId())
                && StringUtils.hasText(razorpayConfig.getKeySecret())) {
            return razorpayClient.get();
        }
        throw new IllegalStateException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payments.");
    }

    private void handlePaymentCapturedWebhook(JSONObject payload) {
        if (payload == null) {
            return;
        }
        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity == null) {
            return;
        }
        upsertCapturedStatusFromRazorpayPayment(paymentEntity);
    }

    private void handlePaymentAuthorizedWebhook(JSONObject payload) {
        if (payload == null) {
            return;
        }
        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity == null) {
            return;
        }

        Payment payment = findPaymentFromRazorpayPayment(paymentEntity);
        if (payment == null || "CAPTURED".equals(payment.getStatus())) {
            return;
        }

        payment.setStatus("AUTHORIZED");
        payment.setRazorpayPaymentId(paymentEntity.optString("id", payment.getRazorpayPaymentId()));
        payment.setPaymentMethod(paymentEntity.optString("method", payment.getPaymentMethod()));
        paymentRepository.save(payment);
    }

    private void handlePaymentFailedWebhook(JSONObject payload) {
        if (payload == null) {
            return;
        }
        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity == null) {
            return;
        }

        Payment payment = findPaymentFromRazorpayPayment(paymentEntity);
        if (payment == null || "CAPTURED".equals(payment.getStatus())) {
            return;
        }

        payment.setStatus("FAILED");
        payment.setRazorpayPaymentId(paymentEntity.optString("id", payment.getRazorpayPaymentId()));
        payment.setPaymentMethod(paymentEntity.optString("method", payment.getPaymentMethod()));
        payment.setErrorCode(paymentEntity.optString("error_code", payment.getErrorCode()));
        payment.setErrorDescription(
                paymentEntity.optString("error_description",
                        paymentEntity.optString("error_reason", "Payment failed")));
        paymentRepository.save(payment);
    }

    private void handleOrderPaidWebhook(JSONObject payload) {
        if (payload == null) {
            return;
        }

        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity != null) {
            upsertCapturedStatusFromRazorpayPayment(paymentEntity);
            return;
        }

        JSONObject orderEntity = payload.optJSONObject("order") != null
                ? payload.getJSONObject("order").optJSONObject("entity")
                : null;
        if (orderEntity == null) {
            return;
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(orderEntity.optString("id", ""))
                .orElse(null);
        if (payment == null || "CAPTURED".equals(payment.getStatus())) {
            return;
        }

        payment.setStatus("CAPTURED");
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        applyMaintenanceBillPaymentIfNeeded(saved, payment.getRazorpayPaymentId());
    }

    private void handlePaymentRefundedWebhook(JSONObject payload) {
        if (payload == null) {
            return;
        }
        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity == null) {
            return;
        }

        Payment payment = findPaymentFromRazorpayPayment(paymentEntity);
        if (payment == null) {
            return;
        }

        payment.setStatus("REFUNDED");
        payment.setRazorpayPaymentId(paymentEntity.optString("id", payment.getRazorpayPaymentId()));
        payment.setPaymentMethod(paymentEntity.optString("method", payment.getPaymentMethod()));
        paymentRepository.save(payment);
    }

    private void upsertCapturedStatusFromRazorpayPayment(JSONObject paymentEntity) {
        Payment payment = findPaymentFromRazorpayPayment(paymentEntity);
        if (payment == null || "CAPTURED".equals(payment.getStatus())) {
            return;
        }

        payment.setStatus("CAPTURED");
        payment.setRazorpayPaymentId(paymentEntity.optString("id", payment.getRazorpayPaymentId()));
        payment.setPaymentMethod(paymentEntity.optString("method", payment.getPaymentMethod()));
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        applyMaintenanceBillPaymentIfNeeded(saved, saved.getRazorpayPaymentId());
    }

    private Payment findPaymentFromRazorpayPayment(JSONObject paymentEntity) {
        String razorpayPaymentId = paymentEntity.optString("id", "");
        String orderId = paymentEntity.optString("order_id", "");

        if (StringUtils.hasText(razorpayPaymentId)) {
            Payment byPaymentId = paymentRepository.findByRazorpayPaymentId(razorpayPaymentId).orElse(null);
            if (byPaymentId != null) {
                return byPaymentId;
            }
        }

        if (StringUtils.hasText(orderId)) {
            return paymentRepository.findByRazorpayOrderId(orderId).orElse(null);
        }

        return null;
    }

    private void applyMaintenanceBillPaymentIfNeeded(Payment payment, String referenceNumber) {
        if (payment.getMaintenanceBill() == null || payment.getUser() == null) {
            return;
        }

        maintenanceBillService.recordOnlinePayment(
                payment.getMaintenanceBill().getId(),
                payment.getAmount(),
                "RAZORPAY",
                referenceNumber,
                payment.getUser().getId()
        );
    }

    private PaymentResponse mapToResponse(Payment payment) {
        LocalDateTime undoExpiresAt = payment.getDeletedAt() == null
            ? null
            : payment.getDeletedAt().plusMinutes(UNDO_WINDOW_MINUTES);
        boolean undoAvailable = undoExpiresAt != null && LocalDateTime.now().isBefore(undoExpiresAt);

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
                .deletedAt(payment.getDeletedAt())
                .undoExpiresAt(undoExpiresAt)
                .undoAvailable(undoAvailable)
                .errorCode(payment.getErrorCode())
                .errorDescription(payment.getErrorDescription())
                .build();
    }
}
