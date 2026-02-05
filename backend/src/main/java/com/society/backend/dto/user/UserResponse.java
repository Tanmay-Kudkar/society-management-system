package com.society.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private Boolean isActive;
    private Long societyId;
    private String societyName;
    private Long flatId;
    private String flatNumber;

    // Constructor for basic response (used in auth)
    public UserResponse(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    // Constructor with societyId (used in /auth/me)
    public UserResponse(Long id, String name, String email, String role, Long societyId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.societyId = societyId;
    }
    
    // Constructor with all basic fields (used in user service)
    public UserResponse(Long id, String name, String email, String role, String phone, 
                       Boolean isActive, Long societyId, String societyName) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.isActive = isActive;
        this.societyId = societyId;
        this.societyName = societyName;
    }
}
