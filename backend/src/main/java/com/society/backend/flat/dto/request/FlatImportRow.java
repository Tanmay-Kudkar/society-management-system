package com.society.backend.flat.dto.request;

import lombok.Getter;
import lombok.Setter;

import com.society.backend.flat.entity.Flat;
import com.society.backend.flat.entity.Wing;
@Getter
@Setter
public class FlatImportRow {
    private int rowNumber;
    private String unitType; // FLAT, SHOP, OFFICE
    private String wingCode; // Wing name/code (optional)
    private String flatNumber; // Unit number (required)
    private String flatType; // Configuration: 1BHK, 2BHK, RETAIL, etc.
    private Integer floor; // Floor number (required)
    private Double area; // Area in sq.ft (optional)

    // Validation fields
    private boolean valid = true;
    private String errorMessage;
}
