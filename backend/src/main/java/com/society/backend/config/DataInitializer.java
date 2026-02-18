package com.society.backend.config;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.repository.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Create Platform Owner if not exists
        // This is the ONLY hardcoded user - all others are created through dashboard
        if (userRepository.findByEmail("master@society.com").isEmpty()) {
            User platformOwner = new User();
            platformOwner.setName("Platform Owner");
            platformOwner.setEmail("master@society.com");
            platformOwner.setPassword(passwordEncoder.encode("master"));
            platformOwner.setRole(Role.PLATFORM_OWNER);
            platformOwner.setPhone(null);
            platformOwner.setIsActive(true);
            platformOwner.setAccountType("platform");
            userRepository.save(platformOwner);
            logger.info("═══════════════════════════════════════════════════════════════");
            logger.info("✅ Platform Owner Created Successfully!");
            logger.info("   Email: master@society.com");
            logger.info("   Password: master");
            logger.warn("   ⚠️  Please change this password after first login!");
            logger.info("═══════════════════════════════════════════════════════════════");
        } else {
            logger.info("✓ Platform Owner already exists");
        }
    }
}
