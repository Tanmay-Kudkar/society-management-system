package com.society.backend.service.report;

import com.society.backend.dto.report.FinancialReportResponse;
import com.society.backend.dto.report.FinancialReportResponse.DailyTrend;
import com.society.backend.dto.report.FinancialReportResponse.MonthlyTrend;
import com.society.backend.dto.report.FinancialReportResponse.UpcomingPayment;
import com.society.backend.entity.MaintenanceBill;
import com.society.backend.entity.Society;
import com.society.backend.entity.Transaction;
import com.society.backend.entity.VendorBill;
import com.society.backend.entity.Contract;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.contract.ContractRepository;
import com.society.backend.repository.maintenance.MaintenanceBillRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.transaction.TransactionRepository;
import com.society.backend.repository.vendor.VendorBillRepository;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TransactionRepository transactionRepository;
    private final SocietyRepository societyRepository;
    private final MaintenanceBillRepository maintenanceBillRepository;
    private final VendorBillRepository vendorBillRepository;
    private final ContractRepository contractRepository;
        private final RoleService roleService;

    @Override
    public FinancialReportResponse getMTDReport(Long societyId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        return generateReport(societyId, startOfMonth, today, "MTD");
    }

    @Override
    public FinancialReportResponse getYTDReport(Long societyId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfYear = today.withDayOfYear(1);
        return generateReport(societyId, startOfYear, today, "YTD");
    }

    @Override
    public FinancialReportResponse getCustomReport(Long societyId, LocalDate startDate, LocalDate endDate) {
        return generateReport(societyId, startDate, endDate, "CUSTOM");
    }

    @Override
    public FinancialReportResponse getDashboardSummary(Long societyId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfYear = today.withDayOfYear(1);

        Society society = getSociety(societyId);

        // MTD totals
        BigDecimal mtdIncome = getSum(societyId, "INCOME", startOfMonth, today);
        BigDecimal mtdExpense = getSum(societyId, "EXPENSE", startOfMonth, today);

        // YTD totals
        BigDecimal ytdIncome = getSum(societyId, "INCOME", startOfYear, today);
        BigDecimal ytdExpense = getSum(societyId, "EXPENSE", startOfYear, today);

        // Cash balance (all time income - expense)
        BigDecimal totalIncome = transactionRepository.sumBySocietyAndType(societyId, "INCOME");
        BigDecimal totalExpense = transactionRepository.sumBySocietyAndType(societyId, "EXPENSE");
        totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;
        BigDecimal cashBalance = totalIncome.subtract(totalExpense);

        // Bills summary
        List<MaintenanceBill> allBills = maintenanceBillRepository.findAll().stream()
                .filter(b -> b.getFlat() != null && b.getFlat().getSociety() != null
                        && b.getFlat().getSociety().getId().equals(societyId))
                .toList();

        int billsPaid = (int) allBills.stream().filter(b -> "PAID".equals(b.getStatus())).count();
        int billsPending = (int) allBills.stream().filter(b -> !"PAID".equals(b.getStatus())).count();

        BigDecimal billsCollected = allBills.stream()
                .filter(b -> "PAID".equals(b.getStatus()))
                .map(MaintenanceBill::getPaidAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal billsPendingAmount = allBills.stream()
                .filter(b -> !"PAID".equals(b.getStatus()))
                .map(b -> b.getAmount().subtract(b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Upcoming expenses
        List<UpcomingPayment> upcomingPayments = getUpcomingPayments(societyId, today.plusDays(30));
        BigDecimal upcomingExpenses = upcomingPayments.stream()
                .map(UpcomingPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return FinancialReportResponse.builder()
                .societyId(societyId)
                .societyName(society.getName())
                .reportType("DASHBOARD")
                .startDate(startOfMonth)
                .endDate(today)
                .totalIncome(mtdIncome)
                .totalExpense(mtdExpense)
                .netBalance(mtdIncome.subtract(mtdExpense))
                .cashBalance(cashBalance)
                .previousPeriodIncome(ytdIncome)
                .previousPeriodExpense(ytdExpense)
                .totalBillsGenerated(allBills.size())
                .billsPaid(billsPaid)
                .billsPending(billsPending)
                .billsCollectedAmount(billsCollected)
                .billsPendingAmount(billsPendingAmount)
                .upcomingExpenses(upcomingExpenses)
                .upcomingPayments(upcomingPayments)
                .build();
    }

    @Override
    public FinancialReportResponse getComparisonReport(Long societyId, String periodType) {
        LocalDate today = LocalDate.now();
        LocalDate currentStart, currentEnd, previousStart, previousEnd;

        if ("MONTH".equalsIgnoreCase(periodType)) {
            currentStart = today.withDayOfMonth(1);
            currentEnd = today;
            previousStart = currentStart.minusMonths(1);
            previousEnd = previousStart.plusMonths(1).minusDays(1);
        } else { // YEAR
            currentStart = today.withDayOfYear(1);
            currentEnd = today;
            previousStart = currentStart.minusYears(1);
            previousEnd = previousStart.plusYears(1).minusDays(1);
        }

        FinancialReportResponse report = generateReport(societyId, currentStart, currentEnd, periodType);

        BigDecimal prevIncome = getSum(societyId, "INCOME", previousStart, previousEnd);
        BigDecimal prevExpense = getSum(societyId, "EXPENSE", previousStart, previousEnd);

        report.setPreviousPeriodIncome(prevIncome);
        report.setPreviousPeriodExpense(prevExpense);

        // Calculate growth percentages
        if (prevIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal incomeGrowth = report.getTotalIncome().subtract(prevIncome)
                    .divide(prevIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            report.setIncomeGrowthPercent(incomeGrowth);
        }

        if (prevExpense.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal expenseGrowth = report.getTotalExpense().subtract(prevExpense)
                    .divide(prevExpense, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            report.setExpenseGrowthPercent(expenseGrowth);
        }

        return report;
    }

    private FinancialReportResponse generateReport(Long societyId, LocalDate startDate, LocalDate endDate,
            String reportType) {
        Society society = getSociety(societyId);

        List<Transaction> transactions = transactionRepository
                .findBySocietyIdAndTransactionDateBetween(societyId, startDate, endDate);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Category breakdown
        Map<String, BigDecimal> incomeByCategory = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));

        Map<String, BigDecimal> expenseByCategory = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));

        // Payment mode breakdown
        Map<String, BigDecimal> incomeByPaymentMode = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .collect(Collectors.groupingBy(
                        t -> t.getPaymentMode() != null ? t.getPaymentMode() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));

        Map<String, BigDecimal> expenseByPaymentMode = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .collect(Collectors.groupingBy(
                        t -> t.getPaymentMode() != null ? t.getPaymentMode() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));

        // Daily trends
        List<DailyTrend> dailyTrends = generateDailyTrends(transactions);

        // Monthly trends
        List<MonthlyTrend> monthlyTrends = generateMonthlyTrends(transactions);

        // Cash balance
        BigDecimal allTimeIncome = transactionRepository.sumBySocietyAndType(societyId, "INCOME");
        BigDecimal allTimeExpense = transactionRepository.sumBySocietyAndType(societyId, "EXPENSE");
        allTimeIncome = allTimeIncome != null ? allTimeIncome : BigDecimal.ZERO;
        allTimeExpense = allTimeExpense != null ? allTimeExpense : BigDecimal.ZERO;
        BigDecimal cashBalance = allTimeIncome.subtract(allTimeExpense);

        // Upcoming payments
        List<UpcomingPayment> upcomingPayments = getUpcomingPayments(societyId, endDate.plusDays(30));
        BigDecimal upcomingExpenses = upcomingPayments.stream()
                .map(UpcomingPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bills summary for period
        List<MaintenanceBill> periodBills = maintenanceBillRepository.findAll().stream()
                .filter(b -> b.getFlat() != null && b.getFlat().getSociety() != null
                        && b.getFlat().getSociety().getId().equals(societyId))
                .filter(b -> b.getCreatedAt() != null
                        && !b.getCreatedAt().toLocalDate().isBefore(startDate)
                        && !b.getCreatedAt().toLocalDate().isAfter(endDate))
                .toList();

        int billsPaid = (int) periodBills.stream().filter(b -> "PAID".equals(b.getStatus())).count();
        int billsPending = (int) periodBills.stream().filter(b -> !"PAID".equals(b.getStatus())).count();

        return FinancialReportResponse.builder()
                .societyId(societyId)
                .societyName(society.getName())
                .reportType(reportType)
                .startDate(startDate)
                .endDate(endDate)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(totalIncome.subtract(totalExpense))
                .cashBalance(cashBalance)
                .incomeByCategory(incomeByCategory)
                .expenseByCategory(expenseByCategory)
                .incomeByPaymentMode(incomeByPaymentMode)
                .expenseByPaymentMode(expenseByPaymentMode)
                .dailyTrends(dailyTrends)
                .monthlyTrends(monthlyTrends)
                .upcomingExpenses(upcomingExpenses)
                .upcomingPayments(upcomingPayments)
                .totalBillsGenerated(periodBills.size())
                .billsPaid(billsPaid)
                .billsPending(billsPending)
                .build();
    }

    private List<DailyTrend> generateDailyTrends(List<Transaction> transactions) {
        Map<LocalDate, DailyTrend> trendMap = new TreeMap<>();

        for (Transaction t : transactions) {
            LocalDate date = t.getTransactionDate();
            DailyTrend trend = trendMap.computeIfAbsent(date,
                    d -> DailyTrend.builder().date(d).income(BigDecimal.ZERO).expense(BigDecimal.ZERO).build());

            if ("INCOME".equals(t.getTransactionType())) {
                trend.setIncome(trend.getIncome().add(t.getAmount()));
            } else {
                trend.setExpense(trend.getExpense().add(t.getAmount()));
            }
        }

        return new ArrayList<>(trendMap.values());
    }

    private List<MonthlyTrend> generateMonthlyTrends(List<Transaction> transactions) {
        Map<String, MonthlyTrend> trendMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Transaction t : transactions) {
            String month = t.getTransactionDate().format(formatter);
            MonthlyTrend trend = trendMap.computeIfAbsent(month, m -> MonthlyTrend.builder().month(m)
                    .income(BigDecimal.ZERO).expense(BigDecimal.ZERO).balance(BigDecimal.ZERO).build());

            if ("INCOME".equals(t.getTransactionType())) {
                trend.setIncome(trend.getIncome().add(t.getAmount()));
            } else {
                trend.setExpense(trend.getExpense().add(t.getAmount()));
            }
            trend.setBalance(trend.getIncome().subtract(trend.getExpense()));
        }

        return new ArrayList<>(trendMap.values());
    }

    private List<UpcomingPayment> getUpcomingPayments(Long societyId, LocalDate untilDate) {
        List<UpcomingPayment> payments = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // Pending vendor bills
        List<VendorBill> pendingVendorBills = vendorBillRepository.findAll().stream()
                .filter(b -> b.getSociety() != null && b.getSociety().getId().equals(societyId))
                .filter(b -> !"PAID".equals(b.getStatus()))
                .filter(b -> b.getDueDate() != null && !b.getDueDate().isAfter(untilDate))
                .toList();

        for (VendorBill bill : pendingVendorBills) {
            BigDecimal pending = bill.getAmount().subtract(
                    bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO);
            payments.add(UpcomingPayment.builder()
                    .description("Vendor: " + (bill.getVendor() != null ? bill.getVendor().getName() : "Unknown"))
                    .amount(pending)
                    .dueDate(bill.getDueDate())
                    .type("VENDOR_BILL")
                    .build());
        }

        // Expiring contracts that need renewal
        List<Contract> expiringContracts = contractRepository.findAll().stream()
                .filter(c -> c.getSociety() != null && c.getSociety().getId().equals(societyId))
                .filter(c -> c.getIsActive() && c.getEndDate() != null)
                .filter(c -> c.getEndDate().isAfter(today) && !c.getEndDate().isAfter(untilDate))
                .toList();

        for (Contract contract : expiringContracts) {
            payments.add(UpcomingPayment.builder()
                    .description("Contract Renewal: " + contract.getTitle())
                    .amount(BigDecimal.ZERO) // Contract renewal amount not stored
                    .dueDate(contract.getEndDate())
                    .type("CONTRACT_RENEWAL")
                    .build());
        }

        // Sort by due date
        payments.sort(Comparator.comparing(UpcomingPayment::getDueDate));

        return payments;
    }

    private BigDecimal getSum(Long societyId, String type, LocalDate start, LocalDate end) {
        BigDecimal sum = transactionRepository.sumBySocietyTypeAndDateRange(societyId, type, start, end);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private Society getSociety(Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return society;
    }
}
