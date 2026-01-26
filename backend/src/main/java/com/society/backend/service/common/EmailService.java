package com.society.backend.service.common;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:Society Management System}")
    private String appName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send a simple text email
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send HTML email
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            logger.info("HTML email sent successfully to: {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send HTML email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send maintenance bill notification
     */
    public void sendMaintenanceBillNotification(String to, String memberName, String flatNumber,
            String billMonth, String amount, String dueDate) {
        String subject = appName + " - Maintenance Bill for " + billMonth;
        String body = String.format("""
                Dear %s,

                Your maintenance bill for Flat %s has been generated.

                Bill Details:
                - Month: %s
                - Amount: ₹%s
                - Due Date: %s

                Please ensure timely payment to avoid late fees.

                Regards,
                %s
                """, memberName, flatNumber, billMonth, amount, dueDate, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send contract expiry reminder
     */
    public void sendContractExpiryReminder(String to, String contractType, String title,
            String expiryDate, int daysRemaining) {
        String subject = appName + " - " + contractType + " Contract Expiring Soon";
        String body = String.format("""
                Dear Admin,

                This is a reminder that the following contract is expiring soon:

                Contract Details:
                - Type: %s
                - Title: %s
                - Expiry Date: %s
                - Days Remaining: %d

                Please take necessary action for renewal.

                Regards,
                %s
                """, contractType, title, expiryDate, daysRemaining, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send tenant agreement expiry reminder
     */
    public void sendTenantAgreementExpiryReminder(String to, String tenantName, String flatNumber,
            String endDate, int daysRemaining) {
        String subject = appName + " - Tenant Agreement Expiring Soon";
        String body = String.format("""
                Dear Admin,

                The following tenant agreement is expiring soon:

                Tenant Details:
                - Name: %s
                - Flat: %s
                - Agreement End Date: %s
                - Days Remaining: %d

                Please coordinate with the tenant for renewal or exit.

                Regards,
                %s
                """, tenantName, flatNumber, endDate, daysRemaining, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send ticket status update
     */
    public void sendTicketStatusUpdate(String to, String memberName, String ticketTitle,
            String oldStatus, String newStatus) {
        String subject = appName + " - Ticket Status Updated";
        String body = String.format("""
                Dear %s,

                Your ticket status has been updated:

                Ticket: %s
                Previous Status: %s
                New Status: %s

                Regards,
                %s
                """, memberName, ticketTitle, oldStatus, newStatus, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send payment confirmation
     */
    public void sendPaymentConfirmation(String to, String memberName, String flatNumber,
            String amount, String receiptNumber) {
        String subject = appName + " - Payment Confirmation";
        String body = String.format("""
                Dear %s,

                Thank you for your payment!

                Payment Details:
                - Flat: %s
                - Amount: ₹%s
                - Receipt Number: %s

                Regards,
                %s
                """, memberName, flatNumber, amount, receiptNumber, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send notice notification
     */
    public void sendNoticeNotification(String to, String memberName, String noticeTitle, String noticeContent) {
        String subject = appName + " - New Notice: " + noticeTitle;
        String body = String.format("""
                Dear %s,

                A new notice has been published:

                %s

                %s

                Regards,
                %s
                """, memberName, noticeTitle, noticeContent, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send escalation email to MASTER_ADMIN
     * Used by SOCIETY_ADMIN when they cannot handle an issue
     */
    public void sendEscalationToMasterAdmin(String masterAdminEmail, String societyName,
            String societyAdminName, String issueType, String issueDetails) {
        String subject = appName + " - ESCALATION: " + issueType + " from " + societyName;
        String body = String.format("""
                Dear Master Admin,

                An issue has been escalated by the Society Admin of %s.

                Escalated By: %s
                Issue Type: %s

                Issue Details:
                %s

                Please review and take necessary action.

                Regards,
                %s
                """, societyName, societyAdminName, issueType, issueDetails, appName);

        sendSimpleEmail(masterAdminEmail, subject, body);
    }

    /**
     * Send society registration notification to MASTER_ADMIN
     */
    public void sendNewSocietyRegistration(String masterAdminEmail, String societyName,
            String societyAddress, String adminName, String adminEmail) {
        String subject = appName + " - New Society Registration Request: " + societyName;
        String body = String.format("""
                Dear Master Admin,

                A new society registration request has been submitted:

                Society Name: %s
                Address: %s

                Requested By:
                - Name: %s
                - Email: %s

                Please review and approve/reject the registration.

                Regards,
                %s
                """, societyName, societyAddress, adminName, adminEmail, appName);

        sendSimpleEmail(masterAdminEmail, subject, body);
    }

    /**
     * Send society approval notification to SOCIETY_ADMIN
     */
    public void sendSocietyApprovalNotification(String societyAdminEmail, String adminName,
            String societyName, boolean isApproved, String remarks) {
        String status = isApproved ? "APPROVED" : "REJECTED";
        String subject = appName + " - Society Registration " + status + ": " + societyName;
        String body = String.format("""
                Dear %s,

                Your society registration request has been %s.

                Society Name: %s
                Status: %s
                %s

                %s

                Regards,
                %s
                """, adminName, status.toLowerCase(), societyName, status,
                isApproved ? "" : "Remarks: " + remarks,
                isApproved ? "You can now login and start managing your society."
                        : "Please contact support for more details.",
                appName);

        sendSimpleEmail(societyAdminEmail, subject, body);
    }
}
