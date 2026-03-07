package com.society.backend.notification.repository;

import com.society.backend.notification.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import com.society.backend.society.entity.Society;
@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findBySocietyId(Long societyId);

    List<Banner> findByIsActiveTrue();

    @Query("SELECT b FROM Banner b WHERE b.isActive = true AND (b.society.id = :societyId OR b.society IS NULL) AND (b.startDate IS NULL OR b.startDate <= :today) AND (b.endDate IS NULL OR b.endDate >= :today) ORDER BY b.displayOrder")
    List<Banner> findActiveBanners(Long societyId, LocalDate today);
}
