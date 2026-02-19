package com.society.backend.repository;

import com.society.backend.entity.CommonAreaSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CommonAreaScheduleRepository extends JpaRepository<CommonAreaSchedule, Long> {

    List<CommonAreaSchedule> findBySocietyIdOrderByAreaNameAsc(Long societyId);

    List<CommonAreaSchedule> findBySocietyIdAndStatusOrderByAreaNameAsc(Long societyId, String status);

    List<CommonAreaSchedule> findBySocietyIdAndAreaTypeOrderByAreaNameAsc(Long societyId, String areaType);

    List<CommonAreaSchedule> findBySocietyIdAndMaintenanceTypeOrderByAreaNameAsc(Long societyId, String maintenanceType);

    List<CommonAreaSchedule> findBySocietyIdAndNextDueDateBeforeAndStatusOrderByNextDueDateAsc(
            Long societyId, LocalDate date, String status);

    long countBySocietyIdAndStatus(Long societyId, String status);
}
