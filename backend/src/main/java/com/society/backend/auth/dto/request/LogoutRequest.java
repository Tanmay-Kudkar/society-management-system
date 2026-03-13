package com.society.backend.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogoutRequest {

    /** Latitude for logout proximity tracking (optional). */
    private Double latitude;

    /** Longitude for logout proximity tracking (optional). */
    private Double longitude;
}
