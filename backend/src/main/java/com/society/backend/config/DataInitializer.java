package com.society.backend.config;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.user.repository.UserRepository;
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
        // Create Master Admin if not exists
        // This is the ONLY hardcoded user - all others are created through dashboard
        if (userRepository.findByEmail("master@society.com").isEmpty()) {
            User masterAdmin = new User();
            masterAdmin.setName("Master Admin");
            masterAdmin.setEmail("master@society.com");
            masterAdmin.setPassword(passwordEncoder.encode("master"));
            masterAdmin.setRole(Role.MASTER_ADMIN);
            masterAdmin.setPhone(null);
            masterAdmin.setIsActive(true);
            masterAdmin.setAccountType(null);
            userRepository.save(masterAdmin);
            logger.info("═══════════════════════════════════════════════════════════════");
            logger.info("✅ Master Admin Created Successfully!");
            logger.info("   Email: master@society.com");
            logger.info("   Password: master");
            logger.warn("   ⚠️  Please change this password after first login!");
            logger.info("═══════════════════════════════════════════════════════════════");
        } else {
            logger.info("✓ Master Admin already exists");
        }
    }
}
