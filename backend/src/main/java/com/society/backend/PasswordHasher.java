package com.society.backend;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHasher {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("admin123");
        System.out.println("Hash for admin123: " + hash);

        // Update the password for the user
        updatePassword("admin@example.com", "admin123");
    }

    public static void updatePassword(String email, String newPassword) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(newPassword);
        System.out.println("Updated password for " + email + ": " + hash);
    }
}
