package com.society.backend.society.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SocietyResponse {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String registrationNumber;
    private String email;
    private String telephone;

    // Total capacity for units
    private Integer totalFlats;
    private Integer totalShops;
    private Integer totalOffices;
    private Integer totalWings;

    private Integer twoWheelerParkingCapacity;
    private Integer fourWheelerParkingCapacity;

    // Actual counts (calculated from database)
    private Long actualFlats;
    private Long actualShops;
    private Long actualOffices;
    private Long actualWings;
    private Long occupiedFlats;
    private Long occupiedShops;
    private Long occupiedOffices;
}
