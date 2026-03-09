package com.society.backend.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /**
     * Portal type selected at login: "admin", "management", "resident"
     */
    private String portalType;

    /** Whether to extend session to 30 days */
    private Boolean rememberMe;

    /** Latitude for proximity login tracking (sent by mobile/browser clients) */
    private Double latitude;

    /** Longitude for proximity login tracking (sent by mobile/browser clients) */
    private Double longitude;

    public boolean isRememberMe() {
        return rememberMe != null && rememberMe;
    }
}
