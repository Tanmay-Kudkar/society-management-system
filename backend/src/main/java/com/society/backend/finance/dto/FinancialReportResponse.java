package com.society.backend.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialReportResponse {

    private Long societyId;
    private String societyName;
    private String reportType; // MTD, YTD, CUSTOM
    private LocalDate startDate;
    private LocalDate endDate;

    // Summary
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netBalance;
    private BigDecimal cashBalance;

    // Comparison with previous period
    private BigDecimal previousPeriodIncome;
    private BigDecimal previousPeriodExpense;
    private BigDecimal incomeGrowthPercent;
    private BigDecimal expenseGrowthPercent;

    // Category-wise breakdown
    private Map<String, BigDecimal> incomeByCategory;
    private Map<String, BigDecimal> expenseByCategory;

    // Payment mode breakdown
    private Map<String, BigDecimal> incomeByPaymentMode;
    private Map<String, BigDecimal> expenseByPaymentMode;

    // Daily/Monthly trends
    private List<DailyTrend> dailyTrends;
    private List<MonthlyTrend> monthlyTrends;

    // Upcoming expenses (for forecasting)
    private BigDecimal upcomingExpenses;
    private List<UpcomingPayment> upcomingPayments;

    // Bills summary
    private Integer totalBillsGenerated;
    private Integer billsPaid;
    private Integer billsPending;
    private BigDecimal billsCollectedAmount;
    private BigDecimal billsPendingAmount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrend {
        private LocalDate date;
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrend {
        private String month; // "2026-01"
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal balance;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingPayment {
        private String description;
        private BigDecimal amount;
        private LocalDate dueDate;
        private String type; // VENDOR_BILL, CONTRACT, etc.
    }
}
