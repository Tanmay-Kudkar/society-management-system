package com.society.backend.ticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintSlaSummaryResponse {
    private long totalOpen;
    private long dueSoon;
    private long breached;
    private long highRisk;
}
