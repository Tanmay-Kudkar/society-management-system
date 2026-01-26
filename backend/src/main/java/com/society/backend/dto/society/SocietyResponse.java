package com.society.backend.dto.society;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SocietyResponse {
    private Long id;
    private String name;
    private String address;
}
