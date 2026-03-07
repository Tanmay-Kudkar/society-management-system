package com.society.backend.flat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.flat.entity.Wing;
import com.society.backend.society.entity.Society;
@Getter
@Setter
public class WingRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Wing name is required")
    private String name;

    private String description;

    private Integer totalFloors;
}
