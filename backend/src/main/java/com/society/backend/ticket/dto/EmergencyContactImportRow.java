package com.society.backend.ticket.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmergencyContactImportRow {
    private int rowNumber;
    private String contactType;
    private String name;
    private String phone;
    private String alternatePhone;
    private String address;
    private String notes;

    private boolean valid = true;
    private String errorMessage;
}
