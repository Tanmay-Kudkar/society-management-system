package com.society.backend.service.common;

import com.society.backend.entity.SequenceCounter;
import com.society.backend.repository.society.SequenceCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Generates sequential, human-readable bill and receipt numbers.
 * F13 — Sequential Receipt/Bill Numbers
 *
 * Bill number format:    BILL-{societyId}-{FY}-{0001}   e.g. BILL-12-2026-0001
 * Receipt number format: RCP-{societyId}-{FY}-{0001}    e.g. RCP-12-2026-0001
 *
 * Financial year is April-March. Numbers reset every April.
 */
@Service
@RequiredArgsConstructor
public class SequenceService {

    private static final String BILL    = "BILL";
    private static final String RECEIPT = "RECEIPT";

    private final SequenceCounterRepository sequenceCounterRepository;

    /**
     * Generate the next sequential bill number for a society.
     * Thread-safe via pessimistic DB lock.
     */
    @Transactional
    public String nextBillNumber(Long societyId) {
        return next(societyId, BILL, "BILL");
    }

    /**
     * Generate the next sequential receipt number for a society.
     * Thread-safe via pessimistic DB lock.
     */
    @Transactional
    public String nextReceiptNumber(Long societyId) {
        return next(societyId, RECEIPT, "RCP");
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private String next(Long societyId, String counterType, String prefix) {
        int fy = currentFinancialYear();

        SequenceCounter counter = sequenceCounterRepository
                .findForUpdate(societyId, counterType, fy)
                .orElseGet(() -> createCounter(societyId, counterType, fy));

        counter.setCurrentValue(counter.getCurrentValue() + 1);
        sequenceCounterRepository.save(counter);

        return String.format("%s-%d-%d-%04d", prefix, societyId, fy, counter.getCurrentValue());
    }

    private SequenceCounter createCounter(Long societyId, String counterType, int fy) {
        SequenceCounter c = new SequenceCounter();
        c.setSocietyId(societyId);
        c.setCounterType(counterType);
        c.setFinancialYear(fy);
        c.setCurrentValue(0L);
        return sequenceCounterRepository.save(c);
    }

    /**
     * Returns the current financial year start.
     * April 2026 – March 2027  →  2026
     */
    private int currentFinancialYear() {
        LocalDate today = LocalDate.now();
        return today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
    }
}
