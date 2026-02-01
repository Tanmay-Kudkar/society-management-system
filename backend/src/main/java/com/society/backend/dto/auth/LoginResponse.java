package com.society.backend.dto.auth;

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private Long societyId;
    private String token;
    private String tokenType = "Bearer";

    public LoginResponse(Long id, String name, String email, String role, Long societyId, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.societyId = societyId;
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public Long getSocietyId() {
        return societyId;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}
