package com.society.backend.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserImportRow {
    private int rowNumber;
    private String name;
    private String email;
    private String flatNumber;
    private String phone;
    private String role;
    
    // Validation results
    private boolean valid = true;
    private String errorMessage;
}
