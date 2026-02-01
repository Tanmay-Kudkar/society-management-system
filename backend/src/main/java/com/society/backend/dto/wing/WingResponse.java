package com.society.backend.dto.wing;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WingResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String name;
    private String description;
    private Integer totalFloors;
    private Long flatCount;
    private Long shopCount;
    private Long officeCount;
    private LocalDateTime createdAt;
}
