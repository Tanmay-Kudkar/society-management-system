package com.society.backend.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateLocationRequest {
    private Double latitude;
    private Double longitude;
}
