package com.society.backend.scheduler;

import com.society.backend.entity.Contract;
import com.society.backend.entity.MaintenanceBill;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.Tenant;
import com.society.backend.entity.User;
import com.society.backend.repository.contract.ContractRepository;
import com.society.backend.repository.maintenance.MaintenanceBillRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.tenant.TenantRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.service.common.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class ReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ReminderScheduler.class);

    private final ContractRepository contractRepository;
    private final TenantRepository tenantRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.reminder.contract-days:30}")
    private int contractReminderDays;

    @Value("${app.reminder.tenant-days:30}")
    private int tenantReminderDays;

    @Value("${app.reminder.bill-days:7}")
    private int billReminderDays;

    @Value("${app.master-admin.email:master@societysms.com}")
    private String masterAdminEmail;

    public ReminderScheduler(ContractRepository contractRepository,
            TenantRepository tenantRepository,
            MaintenanceBillRepository maintenanceBillRepository,
            SocietyRepository societyRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.contractRepository = contractRepository;
        this.tenantRepository = tenantRepository;
        this.maintenanceBillRepository = maintenanceBillRepository;
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Get SOCIETY_ADMIN email for a specific society
     */
    private String getSocietyAdminEmail(Society society) {
        if (society == null)
            return masterAdminEmail;

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SOCIETY_ADMIN)
                .filter(u -> u.getSociety() != null && u.getSociety().getId().equals(society.getId()))
                .map(User::getEmail)
                .findFirst()
                .orElse(masterAdminEmail); // Fallback to master admin
    }

    /**
     * Get all committee member emails for a specific society
     * Includes: SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE
     */
    private List<String> getSocietyCommitteeEmails(Society society) {
        if (society == null)
            return List.of(masterAdminEmail);

        return userRepository.findAll().stream()
                .filter(u -> u.getSociety() != null && u.getSociety().getId().equals(society.getId()))
                .filter(u -> u.getRole() == Role.SOCIETY_ADMIN ||
                        u.getRole() == Role.CHAIRMAN ||
                        u.getRole() == Role.SECRETARY ||
                        u.getRole() == Role.TREASURER ||
                        u.getRole() == Role.COMMITTEE)
                .filter(u -> u.getIsActive() != null && u.getIsActive())
                .map(User::getEmail)
                .toList();
    }

    /**
     * Send email to society's committee members
     */
    private void sendToSocietyCommittee(Society society, String subject, String body) {
        List<String> emails = getSocietyCommitteeEmails(society);
        if (emails.isEmpty()) {
// Fallback to society admin or master admin
            emailService.sendSimpleEmail(getSocietyAdminEmail(society), subject, body);
        } else {
            for (String email : emails) {
                emailService.sendSimpleEmail(email, subject, body);
            }
        }
    }

    /**            
     * Check for expiring contracts daily at 9 AM
     * Sends reminders to SOCIETY_ADMIN and committee of that specific society
     * - AMC expiry
     * - Insurance renewal
     * - Pest control contract
     * - Housekeeping contract
     * - CCTV maintenance
     * - Lift maintenance
     * - Generator maintenance
     * - Security contracts
     * - Fixed Deposits
     */
    @Scheduled(cron = "0 0 9 * * ?") // Every day at 9 AM
    public void checkExpiringContracts() {
        logger.info("Running contract expiry check...");

        LocalDate today = LocalDate.now();
        List<Contract> contracts = contractRepository.findAll();

        for (Contract contract : contracts) {
            if (contract.getIsActive() && contract.getEndDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, contract.getEndDate());

                // Send reminder if within reminder window
                if (daysUntilExpiry > 0 && daysUntilExpiry <= contract.getReminderDays()) {
                    Society society = contract.getSociety();
                    List<String> committeeEmails = getSocietyCommitteeEmails(society);

                    logger.info("Sending reminder for contract: {} (expires in {} days) to society: {}",
                            contract.getTitle(), daysUntilExpiry,
                            society != null ? society.getName() : "Unknown");

                    // Send to society's committee members
                    for (String email : committeeEmails) {
                        emailService.sendContractExpiryReminder(
                                email,
                                contract.getContractType(),
                                contract.getTitle(),
                                contract.getEndDate().toString(),
                                (int) daysUntilExpiry);
                    }

                    // If no committee found, send to society admin
                    if (committeeEmails.isEmpty()) {
                        emailService.sendContractExpiryReminder(
                                getSocietyAdminEmail(society),
                                contract.getContractType(),
                                contract.getTitle(),
                                contract.getEndDate().toString(),
                                (int) daysUntilExpiry);
                    }
                }
            }
        }

        logger.info("Contract expiry check completed.");
    }

    /**
     * Check for expiring tenant agreements daily at 9:30 AM
     * Sends reminders to SOCIETY_ADMIN, COMMITTEE + flat OWNER for Leave & License
     * agreement due
     */
    @Scheduled(cron = "0 30 9 * * ?") // Every day at 9:30 AM
    public void checkExpiringTenantAgreements() {
        logger.info("Running tenant agreement expiry check...");

        LocalDate today = LocalDate.now();
        List<Tenant> tenants = tenantRepository.findAll();

        for (Tenant tenant : tenants) {
            if (tenant.getIsActive() && tenant.getAgreementEndDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, tenant.getAgreementEndDate());

                if (daysUntilExpiry > 0 && daysUntilExpiry <= tenantReminderDays) {
                    String flatNumber = tenant.getFlat() != null ? tenant.getFlat().getFlatNumber() : "N/A";
                    Society society = tenant.getFlat() != null ? tenant.getFlat().getSociety() : null;
                    List<String> committeeEmails = getSocietyCommitteeEmails(society);

                    logger.info("Sending reminder for tenant agreement: {} (expires in {} days)",
                            tenant.getName(), daysUntilExpiry);

                    // Send to society's committee members
                    for (String email : committeeEmails) {
                        emailService.sendTenantAgreementExpiryReminder(
                                email,
                                tenant.getName(),
                                flatNumber,
                                tenant.getAgreementEndDate().toString(),
                                (int) daysUntilExpiry);
                    }

                    // Send to flat owner if email exists
                    if (tenant.getFlat() != null && tenant.getFlat().getOwnerEmail() != null) {
                        emailService.sendTenantAgreementExpiryReminder(
                                tenant.getFlat().getOwnerEmail(),
                                tenant.getName(),
                                flatNumber,
                                tenant.getAgreementEndDate().toString(),
                                (int) daysUntilExpiry);
                    }

                    // Also notify tenant
                    if (tenant.getEmail() != null) {
                        emailService.sendSimpleEmail(
                                tenant.getEmail(),
                                "Rental Agreement Expiring Soon",
                                String.format("""
                                        Dear %s,

                                        Your rental agreement for Flat %s is expiring on %s (%d days remaining).

                                        Please contact your landlord or society office for renewal.

                                        Regards,
                                        Society Management System
                                        """, tenant.getName(), flatNumber, tenant.getAgreementEndDate(),
                                        daysUntilExpiry));
                    }
                }
            }
        }

        logger.info("Tenant agreement expiry check completed.");
    }

    /**
     * Check for pending maintenance bills every Monday at 10 AM
     * Sends reminders to MEMBER (flat owner) for bills due within 7 days
     */
    @Scheduled(cron = "0 0 10 ? * MON") // Every Monday at 10 AM
    public void checkPendingMaintenanceBills() {
        logger.info("Running maintenance bill reminder check...");

        LocalDate today = LocalDate.now();
        LocalDate reminderDate = today.plusDays(billReminderDays);

        List<MaintenanceBill> unpaidBills = maintenanceBillRepository.findAll()
                .stream()
                .filter(bill -> !"PAID".equals(bill.getStatus()))
                .filter(bill -> bill.getDueDate() != null && !bill.getDueDate().isBefore(today))
                .filter(bill -> bill.getDueDate().isBefore(reminderDate) || bill.getDueDate().isEqual(reminderDate))
                .toList();

        for (MaintenanceBill bill : unpaidBills) {
            if (bill.getFlat() != null) {
                String flatNumber = bill.getFlat().getFlatNumber();
                String ownerName = bill.getFlat().getOwnerName() != null ? bill.getFlat().getOwnerName() : "Resident";
                String ownerEmail = bill.getFlat().getOwnerEmail();

                logger.info("Sending bill reminder for flat: {} (Due: {})",
                        flatNumber, bill.getDueDate());

                // Send to flat owner (MEMBER) if email exists
                if (ownerEmail != null && !ownerEmail.isEmpty()) {
                    emailService.sendMaintenanceBillNotification(
                            ownerEmail,
                            ownerName,
                            flatNumber,
                            bill.getBillMonth(),
                            bill.getAmount().toString(),
                            bill.getDueDate().toString());
                }

                // Also send to linked user if exists
                if (bill.getFlat().getOwner() != null) {
                    emailService.sendMaintenanceBillNotification(
                            bill.getFlat().getOwner().getEmail(),
                            bill.getFlat().getOwner().getName(),
                            flatNumber,
                            bill.getBillMonth(),
                            bill.getAmount().toString(),
                            bill.getDueDate().toString());
                }
            }
        }

        logger.info("Maintenance bill reminder check completed.");
    }

    /**
     * Generate monthly maintenance bills on 1st of every month at 8 AM
     * Sends to SOCIETY_ADMIN and committee of each society
     */
    @Scheduled(cron = "0 0 8 1 * ?") // 1st of every month at 8 AM
    public void generateMonthlyBillsReminder() {
        logger.info("Monthly bill generation reminder triggered.");

        List<Society> societies = societyRepository.findAll();

        for (Society society : societies) {
            String subject = "Society Management - Monthly Bill Generation Reminder";
            String body = String.format("""
                    Dear Committee Member,

                    This is a reminder to generate monthly maintenance bills for all flats in %s.

                    Please login to the admin portal and generate bills for this month.

                    Regards,
                    Society Management System
                    """, society.getName());

            sendToSocietyCommittee(society, subject, body);
        }

        logger.info("Monthly bill generation reminder sent to all societies.");
    }

    /**
     * Weekly summary report every Monday at 8 AM
     * Sends to SOCIETY_ADMIN and committee of each society (society-specific data)
     */
    @Scheduled(cron = "0 0 8 ? * MON") // Every Monday at 8 AM
    public void sendWeeklySummary() {
        logger.info("Generating weekly summary...");

        List<Society> societies = societyRepository.findAll();

        for (Society society : societies) {
            Long societyId = society.getId();

            long totalContracts = contractRepository.findAll().stream()
                    .filter(c -> c.getSociety() != null && c.getSociety().getId().equals(societyId))
                    .count();
            long activeContracts = contractRepository.findAll().stream()
                    .filter(c -> c.getSociety() != null && c.getSociety().getId().equals(societyId))
                    .filter(c -> c.getIsActive() && !c.isExpired())
                    .count();

            long totalTenants = tenantRepository.findAll().stream()
                    .filter(t -> t.getFlat() != null && t.getFlat().getSociety() != null
                            && t.getFlat().getSociety().getId().equals(societyId))
                    .count();
            long activeTenants = tenantRepository.findAll().stream()
                    .filter(t -> t.getFlat() != null && t.getFlat().getSociety() != null
                            && t.getFlat().getSociety().getId().equals(societyId))
                    .filter(Tenant::getIsActive)
                    .count();

            long unpaidBills = maintenanceBillRepository.findAll().stream()
                    .filter(b -> b.getFlat() != null && b.getFlat().getSociety() != null
                            && b.getFlat().getSociety().getId().equals(societyId))
                    .filter(b -> !"PAID".equals(b.getStatus()))
                    .count();

            String subject = "Society Management - Weekly Summary Report";
            String body = String.format("""
                    Dear Committee Member,

                    Here is your weekly summary for %s:

                    Contracts:
                    - Total: %d
                    - Active: %d

                    Tenants:
                    - Total: %d
                    - Active: %d

                    Maintenance Bills:
                    - Unpaid: %d

                    Please review and take necessary actions.

                    Regards,
                    Society Management System
                    """, society.getName(), totalContracts, activeContracts,
                    totalTenants, activeTenants, unpaidBills);

            sendToSocietyCommittee(society, subject, body);
        }

        logger.info("Weekly summary sent to all societies.");
    }
}
