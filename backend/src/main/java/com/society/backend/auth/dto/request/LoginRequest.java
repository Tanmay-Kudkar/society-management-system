package com.society.backend.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.security.entity.Visitor;
@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /**
     * Portal type selected at login: "admin", "management", "resident", "visitor"
     */
    private String portalType;

    /** Whether to extend session to 30 days */
    private Boolean rememberMe;

    public boolean isRememberMe() {
        return rememberMe != null && rememberMe;
    }
}
