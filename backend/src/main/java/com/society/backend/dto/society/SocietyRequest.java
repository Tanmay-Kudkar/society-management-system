package com.society.backend.dto.society;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocietyRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String address;
}
