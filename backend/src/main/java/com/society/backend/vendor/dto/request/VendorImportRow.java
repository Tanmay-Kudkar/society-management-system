package com.society.backend.vendor.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorImportRow {
    private int rowNumber;
    private String name;
    private String serviceType;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private String panNumber;

    private boolean valid = true;
    private String errorMessage;
}
