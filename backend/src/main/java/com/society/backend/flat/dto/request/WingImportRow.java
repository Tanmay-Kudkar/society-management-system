package com.society.backend.flat.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WingImportRow {
    private int rowNumber;
    private String name;
    private String description;
    private Integer totalFloors;

    private boolean valid = true;
    private String errorMessage;
}
