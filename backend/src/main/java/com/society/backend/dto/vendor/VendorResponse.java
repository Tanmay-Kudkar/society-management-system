package com.society.backend.dto.vendor;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class VendorResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String name;
    private String serviceType;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private String panNumber;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private Boolean isCommon;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
