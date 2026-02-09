package com.society.backend.config;

import com.society.backend.entity.Role;
import com.society.backend.entity.User;
import com.society.backend.repository.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initializes the PLATFORM_OWNER user on application startup.
 * 
 * PLATFORM_OWNER is the only hardcoded user - the platform owner.
 * All other users must be created through the STRICT role hierarchy:
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (no skip-level creation)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access is LIMITED to direct children only
 * 4. Grandchildren = READ-ONLY (no create/update/delete)
 * 
 * EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below them
 * 
 * CREATION HIERARCHY:
 * ───────────────────
 * - PLATFORM_OWNER → SOCIETY_ADMIN only (direct child)
 * - SOCIETY_ADMIN → ALL below (exception: full CRUD rights)
 * - CHAIRMAN/SECRETARY/TREASURER → COMMITTEE only (direct child)
 * - COMMITTEE → EMPLOYEE, MEMBER (direct children)
 * - EMPLOYEE → VISITOR only (direct child)
 * - MEMBER → TENANT only (direct child, for their flat)
 */
@Component
public class DataInitializer implements CommandLineRunner {

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
        if (userRepository.findByEmail("admin@society.com").isEmpty()) {
            User platformOwner = new User();
            platformOwner.setName("Platform Owner");
            platformOwner.setEmail("admin@society.com");
            platformOwner.setPassword(passwordEncoder.encode("admin123"));
            platformOwner.setRole(Role.PLATFORM_OWNER);
            platformOwner.setPhone("9999999999");
            platformOwner.setIsActive(true);
            platformOwner.setAccountType("platform");
            userRepository.save(platformOwner);
            System.out.println("═══════════════════════════════════════════════════════════════");
            System.out.println("✅ PLATFORM OWNER CREATED");
            System.out.println("   Email:    admin@society.com");
            System.out.println("   Password: admin123");
            System.out.println("   ⚠️  Please change this password after first login!");
            System.out.println("═══════════════════════════════════════════════════════════════");
        } else {
            System.out.println("✓ Platform Owner already exists");
        }
    }
}
