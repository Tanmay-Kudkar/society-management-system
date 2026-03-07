package com.society.backend.auth.repository;

import com.society.backend.auth.entity.PasswordResetToken;
import com.society.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    void deleteByUser(User user);

    void deleteByExpiryDateBefore(LocalDateTime dateTime);
}
