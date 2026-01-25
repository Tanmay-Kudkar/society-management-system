package com.society.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FlatResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String flatNumber;
    private String ownerName;
}
