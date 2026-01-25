package com.society.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SocietyResponse {
    private Long id;
    private String name;
    private String address;
}
