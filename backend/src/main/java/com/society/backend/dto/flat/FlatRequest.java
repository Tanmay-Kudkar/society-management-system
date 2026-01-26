package com.society.backend.dto.flat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FlatRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    private String ownerName;
}
