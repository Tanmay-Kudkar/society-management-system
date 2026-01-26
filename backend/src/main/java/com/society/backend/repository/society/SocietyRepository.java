package com.society.backend.repository.society;

import com.society.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SocietyRepository extends JpaRepository<Society, Long> {
}
