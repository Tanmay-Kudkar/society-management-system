package com.society.backend.repository.user;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findBySocietyId(Long societyId);

    List<User> findByRole(Role role);

    List<User> findBySocietyIdAndRole(Long societyId, Role role);

    long countByRole(Role role);

    long countBySocietyId(Long societyId);
}
