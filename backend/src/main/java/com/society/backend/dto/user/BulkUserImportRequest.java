package com.society.backend.dto.user;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class BulkUserImportRequest {
    private Long societyId;
    private List<UserImportRow> users;
}
