package com.society.backend.common.controller;

import com.society.backend.common.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.society.backend.finance.entity.Payment;
import com.society.backend.flat.entity.Tenant;
import com.society.backend.notification.entity.Notice;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.vendor.entity.Contract;
@RestController
@RequestMapping("/api/test")
public class EmailTestController {

    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Test simple email
     * GET /api/test/email/simple
     */
    @GetMapping("/email/simple")
    public ResponseEntity<Map<String, String>> testSimpleEmail() {
        emailService.sendSimpleEmail(
                adminEmail,
                "🧪 Test Email - Society Management System",
                """
                        Hello Admin,

                        This is a test email from the Society Management System.

                        If you received this, your email configuration is working correctly! ✅

                        Regards,
                        Society Management System
                        """);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Test email sent to " + adminEmail));
    }

    /**
     * Test maintenance bill email
     * GET /api/test/email/bill
     */
    @GetMapping("/email/bill")
    public ResponseEntity<Map<String, String>> testBillEmail() {
        emailService.sendMaintenanceBillNotification(
                adminEmail,
                "Test User",
                "A-101",
                "2026-01",
                "3500",
                "2026-02-05");

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Bill notification email sent to " + adminEmail));
    }

    /**
     * Test contract expiry email
     * GET /api/test/email/contract
     */
    @GetMapping("/email/contract")
    public ResponseEntity<Map<String, String>> testContractEmail() {
        emailService.sendContractExpiryReminder(
                adminEmail,
                "AMC",
                "Elevator Annual Maintenance Contract",
                "2026-02-15",
                20);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Contract expiry email sent to " + adminEmail));
    }

    /**
     * Test tenant agreement email
     * GET /api/test/email/tenant
     */
    @GetMapping("/email/tenant")
    public ResponseEntity<Map<String, String>> testTenantEmail() {
        emailService.sendTenantAgreementExpiryReminder(
                adminEmail,
                "John Doe",
                "B-202",
                "2026-02-10",
                15);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Tenant agreement email sent to " + adminEmail));
    }

    /**
     * Test payment confirmation email
     * GET /api/test/email/payment
     */
    @GetMapping("/email/payment")
    public ResponseEntity<Map<String, String>> testPaymentEmail() {
        emailService.sendPaymentConfirmation(
                adminEmail,
                "Test User",
                "A-101",
                "3500",
                "RCP-2026-001");

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Payment confirmation email sent to " + adminEmail));
    }

    /**
     * Test notice notification email
     * GET /api/test/email/notice
     */
    @GetMapping("/email/notice")
    public ResponseEntity<Map<String, String>> testNoticeEmail() {
        emailService.sendNoticeNotification(
                adminEmail,
                "Resident",
                "Water Supply Interruption",
                "Please note that water supply will be interrupted on 28th January 2026 from 10 AM to 2 PM due to maintenance work.");

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notice notification email sent to " + adminEmail));
    }

    /**
     * Test all emails at once
     * GET /api/test/email/all
     */
    @GetMapping("/email/all")
    public ResponseEntity<Map<String, String>> testAllEmails() {
        testSimpleEmail();
        testBillEmail();
        testContractEmail();
        testTenantEmail();
        testPaymentEmail();
        testNoticeEmail();

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "All 6 test emails sent to " + adminEmail));
    }
}
