package com.society.backend.dto.flat;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class FlatResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private Long wingId;
    private String wingName;
    private String flatNumber;
    private String unitType; // FLAT, SHOP, OFFICE
    private String flatType; // 1BHK, 2BHK, etc. (for FLAT type)
    private Integer floor;
    private BigDecimal area;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private Boolean isOccupied;
}
