package com.society.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Email(message = "Invalid email format. Please enter a valid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 6, max = 50, message = "Password must be between 6 and 50 characters")
    private String password; // Optional for updates

    @NotBlank(message = "Role is required")
    private String role;

    @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$|^$", message = "Invalid phone number format. Use 10-digit mobile number")
    private String phone;

    private Long societyId; // Required when MASTER_ADMIN creates SOCIETY_ADMIN
}
