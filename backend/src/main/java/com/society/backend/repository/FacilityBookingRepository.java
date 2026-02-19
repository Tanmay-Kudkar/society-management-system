package com.society.backend.repository;

import com.society.backend.entity.FacilityBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FacilityBookingRepository extends JpaRepository<FacilityBooking, Long> {

    List<FacilityBooking> findBySocietyIdOrderByBookingDateDesc(Long societyId);

    List<FacilityBooking> findBySocietyIdAndStatusOrderByBookingDateDesc(Long societyId, String status);

    List<FacilityBooking> findBySocietyIdAndBookingDateOrderByStartTime(Long societyId, LocalDate bookingDate);

    List<FacilityBooking> findBySocietyIdAndFacilityTypeOrderByBookingDateDesc(Long societyId, String facilityType);

    List<FacilityBooking> findByBookedByIdOrderByBookingDateDesc(Long bookedById);

    @Query("SELECT fb FROM FacilityBooking fb WHERE fb.society.id = :societyId " +
           "AND fb.bookingDate BETWEEN :startDate AND :endDate ORDER BY fb.bookingDate, fb.startTime")
    List<FacilityBooking> findBySocietyIdAndDateRange(@Param("societyId") Long societyId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT fb FROM FacilityBooking fb WHERE fb.society.id = :societyId " +
           "AND fb.facilityName = :facilityName AND fb.bookingDate = :bookingDate " +
           "AND fb.status IN ('PENDING', 'APPROVED') ORDER BY fb.startTime")
    List<FacilityBooking> findConflicting(@Param("societyId") Long societyId,
                                           @Param("facilityName") String facilityName,
                                           @Param("bookingDate") LocalDate bookingDate);

    long countBySocietyIdAndStatus(Long societyId, String status);
}
