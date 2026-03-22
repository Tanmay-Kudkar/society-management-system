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
import com.society.backend.finance.entity.PaymentWebhookEvent;
import com.society.backend.finance.repository.MaintenanceBillRepository;
import com.society.backend.finance.repository.PaymentRepository;
import com.society.backend.finance.repository.PaymentWebhookEventRepository;
import com.society.backend.user.repository.UserRepository;
import com.society.backend.vendor.entity.VendorBill;
import com.society.backend.vendor.repository.VendorBillRepository;
import com.society.backend.vendor.service.VendorBillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
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
import com.society.backend.user.entity.Role;
import com.society.backend.user.entity.User;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final long UNDO_WINDOW_MINUTES = 30;

    private final Optional<RazorpayClient> razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final UserRepository userRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final MaintenanceBillService maintenanceBillService;
    private final VendorBillRepository vendorBillRepository;
    private final VendorBillService vendorBillService;

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        RazorpayClient client = requireRazorpayClient();
        try {
            User requester = getAuthenticatedUser();
            Long targetUserId = request.getUserId() != null ? request.getUserId() : requester.getId();

            User user = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            if (!requester.getId().equals(user.getId())) {
                if (!isManagementRole(requester.getRole())) {
                    throw new ApiException(HttpStatus.FORBIDDEN,
                            "You are not allowed to create payment orders for another user");
                }

                // Non-master roles can act only inside their own society scope.
                if (requester.getRole() != Role.MASTER_ADMIN) {
                    Long requesterSocietyId = requester.getSociety() != null ? requester.getSociety().getId() : null;
                    Long targetSocietyId = user.getSociety() != null ? user.getSociety().getId() : null;
                    if (requesterSocietyId == null || targetSocietyId == null
                            || !requesterSocietyId.equals(targetSocietyId)) {
                        throw new ApiException(HttpStatus.FORBIDDEN,
                                "You can create payment orders only for users in your society");
                    }
                }
            }

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

            if (request.getVendorBillId() != null) {
                VendorBill bill = vendorBillRepository.findById(request.getVendorBillId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vendor bill not found"));
                payment.setVendorBill(bill);
                if (bill.getSociety() != null) {
                    payment.setSociety(bill.getSociety());
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
            if (!request.getRazorpayOrderId().equals(payment.getRazorpayOrderId())) {
                payment.setStatus("FAILED");
                payment.setErrorCode("ORDER_MISMATCH");
                payment.setErrorDescription("Order id does not match payment record");
                paymentRepository.save(payment);
                throw new ApiException(HttpStatus.BAD_REQUEST, "Payment verification failed: order mismatch");
            }

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
            applyLinkedBillPaymentIfNeeded(savedPayment, request.getRazorpayPaymentId());
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
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

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
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

        if ("CAPTURED".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus()) || "REFUNDED".equals(payment.getStatus())) {
            return mapToResponse(payment);
        }

        payment.setStatus("CANCELLED");
        payment.setErrorCode("CHECKOUT_CANCELLED");
        payment.setErrorDescription(StringUtils.hasText(reason) ? reason : "Payment cancelled by user");

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse requestRefund(Long paymentId, Long requesterUserId, RefundRequest request) {
        RazorpayClient client = requireRazorpayClient();

        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        User requester = getAuthenticatedUser();

        if (!requester.getId().equals(requesterUserId) && !isManagementRole(requester.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to request refund for another user");
        }

        validateRefundRequester(requester, payment);

        if (!"CAPTURED".equals(payment.getStatus()) && !"REFUNDED".equals(payment.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Refund can only be requested for captured/refunded payments");
        }

        if (!StringUtils.hasText(payment.getRazorpayPaymentId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Razorpay payment id missing; cannot request refund");
        }

        BigDecimal refundAmount = request != null && request.getAmount() != null
                ? request.getAmount()
                : payment.getAmount();

        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Refund amount must be greater than 0");
        }

        if (refundAmount.compareTo(payment.getAmount()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Refund amount cannot exceed paid amount");
        }

        try {
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", refundAmount.multiply(BigDecimal.valueOf(100)).longValue());

            String reason = request != null ? request.getReason() : null;
            if (StringUtils.hasText(reason)) {
                JSONObject notes = new JSONObject();
                notes.put("reason", reason);
                notes.put("requested_by", requester.getId().toString());
                refundRequest.put("notes", notes);
            }

            com.razorpay.Refund refund = client.payments.refund(payment.getRazorpayPaymentId(), refundRequest);

            String refundStatus = readRazorpayValue(refund, "status", "created").toUpperCase();
            payment.setRefundId(readRazorpayValue(refund, "id", payment.getRefundId()));
            payment.setRefundAmount(refundAmount);
            payment.setRefundStatus(mapRefundStatus(refundStatus));
            payment.setRefundInitiatedAt(LocalDateTime.now());
            payment.setRefundFailureReason(null);

            if ("PROCESSED".equals(payment.getRefundStatus())) {
                payment.setStatus("REFUNDED");
                payment.setRefundProcessedAt(LocalDateTime.now());
            }

            return mapToResponse(paymentRepository.save(payment));

        } catch (RazorpayException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Refund request failed: " + e.getMessage());
        }
    }

    @Transactional
    public Map<String, String> handleWebhook(String payload, String signature, String eventId) {
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

        PaymentWebhookEvent trackedEvent = null;

        if (StringUtils.hasText(eventId)) {
            trackedEvent = registerWebhookEventIfFirst(eventId, event);
        }

        if (StringUtils.hasText(eventId) && trackedEvent == null) {
            log.info("Ignoring duplicate Razorpay webhook eventId={} event={}", eventId, event);
            return Map.of("status", "duplicate", "event", event, "eventId", eventId);
        }

        try {
            switch (event) {
                case "payment.captured" -> handlePaymentCapturedWebhook(eventPayload);
                case "payment.authorized" -> handlePaymentAuthorizedWebhook(eventPayload);
                case "payment.failed" -> handlePaymentFailedWebhook(eventPayload);
                case "payment.refunded" -> handlePaymentRefundedWebhook(eventPayload);
                case "refund.created" -> handleRefundCreatedWebhook(eventPayload);
                case "refund.processed" -> handleRefundProcessedWebhook(eventPayload);
                case "refund.failed" -> handleRefundFailedWebhook(eventPayload);
                case "settlement.processed" -> handleSettlementProcessedWebhook(eventPayload);
                case "settlement.failed" -> handleSettlementFailedWebhook(eventPayload);
                case "order.paid" -> handleOrderPaidWebhook(eventPayload);
                default -> {
                    markWebhookEvent(trackedEvent, "IGNORED", "Unhandled event type");
                    log.debug("Unhandled Razorpay webhook event: {}", event);
                    return StringUtils.hasText(eventId)
                            ? Map.of("status", "ignored", "event", event, "eventId", eventId)
                            : Map.of("status", "ignored", "event", event);
                }
            }
        } catch (Exception processingException) {
            markWebhookEvent(trackedEvent, "FAILED", processingException.getMessage());
            throw processingException;
        }

        markWebhookEvent(trackedEvent, "PROCESSED", "Processed successfully");

        return StringUtils.hasText(eventId)
                ? Map.of("status", "processed", "event", event, "eventId", eventId)
                : Map.of("status", "processed", "event", event);
    }

    private PaymentWebhookEvent registerWebhookEventIfFirst(String eventId, String eventType) {
        try {
            PaymentWebhookEvent event = new PaymentWebhookEvent();
            event.setEventId(eventId);
            event.setEventType(eventType);
            return paymentWebhookEventRepository.save(event);
        } catch (DataIntegrityViolationException duplicateEvent) {
            return null;
        }
    }

    private void markWebhookEvent(PaymentWebhookEvent event, String status, String details) {
        if (event == null) {
            return;
        }
        event.setProcessingStatus(status);
        event.setProcessingDetails(details);
        paymentWebhookEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<PaymentWebhookEventResponse> getRecentWebhookEvents(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return paymentWebhookEventRepository.findAllByOrderByReceivedAtDesc(PageRequest.of(0, safeLimit))
                .stream()
                .map(this::mapWebhookEventToResponse)
                .collect(Collectors.toList());
    }

    private PaymentWebhookEventResponse mapWebhookEventToResponse(PaymentWebhookEvent event) {
        return PaymentWebhookEventResponse.builder()
                .id(event.getId())
                .eventId(event.getEventId())
                .eventType(event.getEventType())
                .processingStatus(event.getProcessingStatus())
                .processingDetails(event.getProcessingDetails())
                .receivedAt(event.getReceivedAt())
                .build();
    }

    @Transactional
    public void deletePayment(Long id, Long deletedByUserId) {
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

        payment.setDeletedAt(LocalDateTime.now());
        payment.setDeletedBy(requester.getId());
        paymentRepository.save(payment);
    }

    @Transactional
    public PaymentResponse undoDeletePayment(Long id) {
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

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
        User requester = getAuthenticatedUser();
        enforceRequesterCanAccessSociety(requester, societyId);

        return paymentRepository.findBySocietyIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(societyId)
                .stream()
                .map(this::mapToResponse)
                .filter(PaymentResponse::getUndoAvailable)
                .collect(Collectors.toList());
    }

    public PaymentResponse getPaymentById(Long id) {
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(String orderId) {
        User requester = getAuthenticatedUser();
        Payment payment = paymentRepository.findByRazorpayOrderIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));

        if (!canReadPayment(requester, payment)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
        }

        return mapToResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        User requester = getAuthenticatedUser();

        if (!isManagementRole(requester.getRole()) && !requester.getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can access only your own payments");
        }

        if (isManagementRole(requester.getRole()) && requester.getRole() != Role.MASTER_ADMIN) {
            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            Long targetSocietyId = targetUser.getSociety() != null ? targetUser.getSociety().getId() : null;
            enforceRequesterCanAccessSociety(requester, targetSocietyId);
        }

        return paymentRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .filter(payment -> canReadPayment(requester, payment))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsBySociety(Long societyId) {
        User requester = getAuthenticatedUser();
        enforceRequesterCanAccessSociety(requester, societyId);

        return paymentRepository.findBySocietyIdAndDeletedAtIsNullOrderByCreatedAtDesc(societyId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByMaintenanceBill(Long billId) {
        User requester = getAuthenticatedUser();
        return paymentRepository.findByMaintenanceBillIdAndDeletedAtIsNull(billId)
                .stream()
                .filter(payment -> canReadPayment(requester, payment))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private User getAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private boolean canReadPayment(User requester, Payment payment) {
        if (requester == null || payment == null) {
            return false;
        }

        if (isManagementRole(requester.getRole())) {
            if (requester.getRole() == Role.MASTER_ADMIN) {
                return true;
            }
            Long paymentSocietyId = resolvePaymentSocietyId(payment);
            Long requesterSocietyId = requester.getSociety() != null ? requester.getSociety().getId() : null;
            return requesterSocietyId != null
                    && paymentSocietyId != null
                    && requesterSocietyId.equals(paymentSocietyId);
        }

        return payment.getUser() != null && requester.getId().equals(payment.getUser().getId());
    }

    private void enforceRequesterCanAccessSociety(User requester, Long societyId) {
        if (requester == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (requester.getRole() == Role.MASTER_ADMIN) {
            return;
        }

        Long requesterSocietyId = requester.getSociety() != null ? requester.getSociety().getId() : null;
        if (requesterSocietyId == null || societyId == null || !requesterSocietyId.equals(societyId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied for target society");
        }
    }

    private Long resolvePaymentSocietyId(Payment payment) {
        if (payment.getSociety() != null) {
            return payment.getSociety().getId();
        }
        if (payment.getUser() != null && payment.getUser().getSociety() != null) {
            return payment.getUser().getSociety().getId();
        }
        if (payment.getMaintenanceBill() != null) {
            if (payment.getMaintenanceBill().getSociety() != null) {
                return payment.getMaintenanceBill().getSociety().getId();
            }
            if (payment.getMaintenanceBill().getFlat() != null && payment.getMaintenanceBill().getFlat().getSociety() != null) {
                return payment.getMaintenanceBill().getFlat().getSociety().getId();
            }
        }
        if (payment.getVendorBill() != null && payment.getVendorBill().getSociety() != null) {
            return payment.getVendorBill().getSociety().getId();
        }
        return null;
    }

    private boolean isManagementRole(Role role) {
        return role == Role.MASTER_ADMIN
                || role == Role.SOCIETY_ADMIN
                || role == Role.MANAGER
                || role == Role.CHAIRMAN
                || role == Role.SECRETARY
                || role == Role.TREASURER;
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
            if (!StringUtils.hasText(payment.getSettlementStatus())) {
                payment.setSettlementStatus("PENDING");
            }
        Payment saved = paymentRepository.save(payment);
        applyLinkedBillPaymentIfNeeded(saved, payment.getRazorpayPaymentId());
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
        payment.setRefundStatus("PROCESSED");
        payment.setRefundProcessedAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    private void handleRefundCreatedWebhook(JSONObject payload) {
        Payment payment = findPaymentFromRefundPayload(payload);
        JSONObject refundEntity = getRefundEntity(payload);
        if (payment == null || refundEntity == null) {
            return;
        }

        payment.setRefundId(refundEntity.optString("id", payment.getRefundId()));
        payment.setRefundStatus("INITIATED");
        payment.setRefundAmount(readAmountInRupees(refundEntity, "amount", payment.getRefundAmount()));
        payment.setRefundInitiatedAt(readEpochDateTime(refundEntity, "created_at", LocalDateTime.now()));
        paymentRepository.save(payment);
    }

    private void handleRefundProcessedWebhook(JSONObject payload) {
        Payment payment = findPaymentFromRefundPayload(payload);
        JSONObject refundEntity = getRefundEntity(payload);
        if (payment == null || refundEntity == null) {
            return;
        }

        payment.setRefundId(refundEntity.optString("id", payment.getRefundId()));
        payment.setRefundStatus("PROCESSED");
        payment.setRefundAmount(readAmountInRupees(refundEntity, "amount", payment.getRefundAmount()));
        payment.setRefundProcessedAt(readEpochDateTime(refundEntity, "processed_at", LocalDateTime.now()));
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);
    }

    private void handleRefundFailedWebhook(JSONObject payload) {
        Payment payment = findPaymentFromRefundPayload(payload);
        JSONObject refundEntity = getRefundEntity(payload);
        if (payment == null || refundEntity == null) {
            return;
        }

        payment.setRefundId(refundEntity.optString("id", payment.getRefundId()));
        payment.setRefundStatus("FAILED");
        payment.setRefundFailureReason(refundEntity.optString("error_description",
                refundEntity.optString("status_description", "Refund failed")));
        paymentRepository.save(payment);
    }

    private void handleSettlementProcessedWebhook(JSONObject payload) {
        Payment payment = findPaymentFromSettlementPayload(payload);
        JSONObject settlementEntity = getSettlementEntity(payload);
        if (payment == null || settlementEntity == null) {
            return;
        }

        payment.setSettlementStatus("PROCESSED");
        payment.setSettlementId(settlementEntity.optString("id", payment.getSettlementId()));
        payment.setSettlementUtr(settlementEntity.optString("utr", payment.getSettlementUtr()));
        payment.setSettledAt(readEpochDateTime(settlementEntity, "created_at", LocalDateTime.now()));
        paymentRepository.save(payment);
    }

    private void handleSettlementFailedWebhook(JSONObject payload) {
        Payment payment = findPaymentFromSettlementPayload(payload);
        JSONObject settlementEntity = getSettlementEntity(payload);
        if (payment == null || settlementEntity == null) {
            return;
        }

        payment.setSettlementStatus("FAILED");
        payment.setSettlementId(settlementEntity.optString("id", payment.getSettlementId()));
        paymentRepository.save(payment);
    }

    private JSONObject getRefundEntity(JSONObject payload) {
        if (payload == null) {
            return null;
        }
        return payload.optJSONObject("refund") != null
                ? payload.getJSONObject("refund").optJSONObject("entity")
                : null;
    }

    private JSONObject getSettlementEntity(JSONObject payload) {
        if (payload == null) {
            return null;
        }
        return payload.optJSONObject("settlement") != null
                ? payload.getJSONObject("settlement").optJSONObject("entity")
                : null;
    }

    private Payment findPaymentFromRefundPayload(JSONObject payload) {
        JSONObject refundEntity = getRefundEntity(payload);
        if (refundEntity == null) {
            return null;
        }

        String paymentId = refundEntity.optString("payment_id", "");
        if (StringUtils.hasText(paymentId)) {
            Payment byPaymentId = paymentRepository.findByRazorpayPaymentId(paymentId).orElse(null);
            if (byPaymentId != null) {
                return byPaymentId;
            }
        }

        String orderId = refundEntity.optString("order_id", "");
        if (StringUtils.hasText(orderId)) {
            return paymentRepository.findByRazorpayOrderId(orderId).orElse(null);
        }

        return null;
    }

    private Payment findPaymentFromSettlementPayload(JSONObject payload) {
        if (payload == null) {
            return null;
        }

        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity != null) {
            return findPaymentFromRazorpayPayment(paymentEntity);
        }

        JSONObject settlementEntity = getSettlementEntity(payload);
        if (settlementEntity == null) {
            return null;
        }

        String paymentId = settlementEntity.optString("payment_id", "");
        if (StringUtils.hasText(paymentId)) {
            Payment byPaymentId = paymentRepository.findByRazorpayPaymentId(paymentId).orElse(null);
            if (byPaymentId != null) {
                return byPaymentId;
            }
        }

        String orderId = settlementEntity.optString("order_id", "");
        if (StringUtils.hasText(orderId)) {
            return paymentRepository.findByRazorpayOrderId(orderId).orElse(null);
        }

        return null;
    }

    private BigDecimal readAmountInRupees(JSONObject entity, String field, BigDecimal fallback) {
        if (entity == null || !entity.has(field)) {
            return fallback;
        }
        long amountInPaise = entity.optLong(field, -1L);
        if (amountInPaise < 0) {
            return fallback;
        }
        return BigDecimal.valueOf(amountInPaise, 2);
    }

    private LocalDateTime readEpochDateTime(JSONObject entity, String field, LocalDateTime fallback) {
        if (entity == null || !entity.has(field)) {
            return fallback;
        }
        long seconds = entity.optLong(field, -1L);
        if (seconds <= 0) {
            return fallback;
        }
        return LocalDateTime.ofEpochSecond(seconds, 0, java.time.ZoneOffset.UTC);
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
        if (!StringUtils.hasText(payment.getSettlementStatus())) {
            payment.setSettlementStatus("PENDING");
        }
        Payment saved = paymentRepository.save(payment);
        applyLinkedBillPaymentIfNeeded(saved, saved.getRazorpayPaymentId());
    }

    private void validateRefundRequester(User requester, Payment payment) {
        boolean elevated = isManagementRole(requester.getRole());

        boolean isOwner = payment.getUser() != null && payment.getUser().getId().equals(requester.getId());

        if (!elevated && !isOwner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to request refund for this payment");
        }

        if (requester.getRole() != Role.MASTER_ADMIN && payment.getSociety() != null && requester.getSociety() != null) {
            if (!payment.getSociety().getId().equals(requester.getSociety().getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Payment belongs to another society");
            }
        }
    }

    private String mapRefundStatus(String razorpayStatus) {
        return switch (razorpayStatus) {
            case "PROCESSED" -> "PROCESSED";
            case "FAILED" -> "FAILED";
            default -> "INITIATED";
        };
    }

    private String readRazorpayValue(com.razorpay.Entity entity, String key, String fallback) {
        try {
            Object value = entity.get(key);
            if (value == null) {
                return fallback;
            }
            String text = String.valueOf(value);
            return StringUtils.hasText(text) ? text : fallback;
        } catch (Exception ignored) {
            return fallback;
        }
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

    private void applyLinkedBillPaymentIfNeeded(Payment payment, String referenceNumber) {
        if (payment.getUser() == null) {
            return;
        }

        if (payment.getMaintenanceBill() != null) {
            maintenanceBillService.recordOnlinePayment(
                    payment.getMaintenanceBill().getId(),
                    payment.getAmount(),
                    "RAZORPAY",
                    referenceNumber,
                    payment.getUser().getId()
            );
            return;
        }

        if (payment.getVendorBill() != null) {
            vendorBillService.recordOnlinePayment(
                    payment.getVendorBill().getId(),
                    payment.getAmount(),
                    "RAZORPAY",
                    referenceNumber,
                    payment.getUser().getId()
            );
        }
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
                .vendorBillId(payment.getVendorBill() != null ? payment.getVendorBill().getId() : null)
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
                .refundId(payment.getRefundId())
                .refundStatus(payment.getRefundStatus())
                .refundAmount(payment.getRefundAmount())
                .refundInitiatedAt(payment.getRefundInitiatedAt())
                .refundProcessedAt(payment.getRefundProcessedAt())
                .refundFailureReason(payment.getRefundFailureReason())
                .settlementStatus(payment.getSettlementStatus())
                .settlementId(payment.getSettlementId())
                .settlementUtr(payment.getSettlementUtr())
                .settledAt(payment.getSettledAt())
                .build();
    }
}
