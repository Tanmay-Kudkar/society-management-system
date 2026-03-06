package com.society.backend.auth.dto;

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String accountType;
    private Long societyId;
    private Long flatId;
    private String token;
    private String tokenType = "Bearer";

    public LoginResponse(Long id, String name, String email, String role,
            String accountType, Long societyId, Long flatId, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.accountType = accountType;
        this.societyId = societyId;
        this.flatId = flatId;
        this.token = token;
    }

    // Backward-compatible constructor
    public LoginResponse(Long id, String name, String email, String role, Long societyId, Long flatId, String token) {
        this(id, name, email, role, null, societyId, flatId, token);
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

    public String getAccountType() {
        return accountType;
    }

    public Long getSocietyId() {
        return societyId;
    }

    public Long getFlatId() {
        return flatId;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}
