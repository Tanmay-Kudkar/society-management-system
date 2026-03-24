package com.society.backend.common.service;

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

import com.society.backend.finance.entity.Payment;
import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Tenant;
import com.society.backend.notification.entity.Notice;
import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Ticket;
import com.society.backend.user.entity.Role;
import com.society.backend.vendor.entity.Contract;
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:Society Management System}")
    private String appName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

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
     * Send password reset email with professional HTML template
     */
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
        String safeUserName = escapeHtml(userName);
        String subject = appName + " \u2014 Password Reset Request";

        String htmlContent = String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Password Reset</title>
                        </head>

                        <body style="margin:0; padding:0; background-color:#eef2f7; font-family:Segoe UI, Roboto, Arial, sans-serif;">

                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
                            <tr>
                              <td align="center">

                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                                  style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #dce6f5;">

                                  <tr>
                                    <td style="background:linear-gradient(135deg,#1f6feb,#3b82f6); padding:32px 24px; text-align:center;">

                                      <div style="display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(255,255,255,0.15); font-size:11px; font-weight:600; color:#ffffff; letter-spacing:0.05em;">
                                        SECURITY ALERT
                                      </div>

                                      <h1 style="margin:16px 0 6px; font-size:24px; color:#ffffff; font-weight:700;">
                                        %s
                                      </h1>

                                      <p style="margin:0; font-size:14px; color:#e0ecff;">
                                        Password Reset Request
                                      </p>
                                    </td>
                                  </tr>

                                  <tr>
                                    <td style="padding:28px 24px;">

                                      <p style="margin:0; font-size:15px; color:#111827;">
                                        Hello <strong>%s</strong>,
                                      </p>

                                      <p style="margin:16px 0 0; font-size:14px; color:#4b5563; line-height:1.6;">
                                        We received a request to reset your password. Click the button below to securely set a new password.
                                      </p>

                                      <table role="presentation" align="center" style="margin:28px auto;">
                                        <tr>
                                          <td align="center" bgcolor="#1f6feb" style="border-radius:10px;">
                                            <a href="%s" target="_blank"
                                              style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                                              Reset Password
                                            </a>
                                          </td>
                                        </tr>
                                      </table>

                                      <div style="margin-top:20px; padding:14px; background:#f1f5ff; border:1px solid #dbe7ff; border-radius:10px;">
                                        <p style="margin:0; font-size:12px; color:#6b7280;">
                                          If the button doesn't work, copy and paste this link:
                                        </p>
                                        <p style="margin:6px 0 0; font-size:12px; color:#1f6feb; word-break:break-all;">
                                          %s
                                        </p>
                                      </div>

                                      <p style="margin:20px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
                                        This link will expire in <strong>30 minutes</strong>. If you did not request this, you can safely ignore this email.
                                      </p>

                                    </td>
                                  </tr>

                                  <tr>
                                    <td style="height:1px; background:#e5e7eb;"></td>
                                  </tr>

                                  <tr>
                                    <td style="padding:18px 24px; text-align:center; background:#f9fafb;">
                                      <p style="margin:0; font-size:12px; color:#9ca3af;">
                                        This is an automated message from %s. Please do not reply.
                                      </p>
                                    </td>
                                  </tr>

                                </table>

                              </td>
                            </tr>
                          </table>

                        </body>
                        </html>
                        """,
                appName, safeUserName, resetUrl, resetUrl, appName);

        sendHtmlEmail(toEmail, subject, htmlContent);
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

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
    }
}
