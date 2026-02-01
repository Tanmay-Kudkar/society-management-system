package com.society.backend.repository.user;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.society WHERE u.society.id = :societyId")
    List<User> findBySocietyId(@Param("societyId") Long societyId);

    List<User> findByRole(Role role);

    List<User> findBySocietyIdAndRole(Long societyId, Role role);

    long countByRole(Role role);

    long countBySocietyId(Long societyId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.society WHERE u.email = :email")
    Optional<User> findByEmailWithSociety(@Param("email") String email);
}
