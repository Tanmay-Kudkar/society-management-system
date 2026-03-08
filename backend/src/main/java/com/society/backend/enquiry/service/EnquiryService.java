package com.society.backend.enquiry.service;

import com.society.backend.enquiry.dto.request.EnquiryRequest;
import com.society.backend.enquiry.dto.response.EnquiryResponse;

import java.util.List;

public interface EnquiryService {
    EnquiryResponse submit(EnquiryRequest request);
    List<EnquiryResponse> getAll();
}
