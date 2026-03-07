package com.society.backend.common.config;

import com.society.backend.common.service.ReferenceCleanupService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

import com.society.backend.vendor.entity.Vendor;
@Component
@RequiredArgsConstructor
public class DeleteForceCleanupInterceptor implements HandlerInterceptor {

    private final ReferenceCleanupService referenceCleanupService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!"DELETE".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String forceParam = request.getParameter("force");
        if (!"true".equalsIgnoreCase(forceParam)) {
            return true;
        }

        ParsedDeleteRequest parsed = parseDeleteRequest(request.getRequestURI());
        if (parsed == null) {
            return true;
        }

        switch (parsed.resource) {
            case "users", "societies" -> {
                return true;
            }
            case "flats" -> referenceCleanupService.clearReferences("flat_id", parsed.id, true, Set.of("flats"));
            case "wings" -> referenceCleanupService.clearReferences("wing_id", parsed.id, true, Set.of("wings"));
            case "vendors" -> referenceCleanupService.clearReferences("vendor_id", parsed.id, true, Set.of("vendors"));
            case "vendor-bills" -> referenceCleanupService.clearReferences("vendor_bill_id", parsed.id, true, Set.of("vendor_bills"));
            case "contracts" -> referenceCleanupService.clearReferences("contract_id", parsed.id, true, Set.of("contracts"));
            case "maintenance-bills" -> referenceCleanupService.clearReferences("maintenance_bill_id", parsed.id, true, Set.of("maintenance_bills"));
            case "transactions" -> referenceCleanupService.clearReferences("transaction_id", parsed.id, true, Set.of("transactions"));
            case "notices" -> referenceCleanupService.clearReferences("notice_id", parsed.id, true, Set.of("notices"));
            case "banners" -> referenceCleanupService.clearReferences("banner_id", parsed.id, true, Set.of("banners"));
            case "tickets" -> referenceCleanupService.clearReferences("ticket_id", parsed.id, true, Set.of("tickets"));
            case "complaints" -> referenceCleanupService.clearReferences("complaint_id", parsed.id, true, Set.of("complaints"));
            case "emergency-contacts" -> referenceCleanupService.clearReferences("emergency_contact_id", parsed.id, true, Set.of("emergency_contacts"));
            case "document-templates" -> referenceCleanupService.clearReferences("document_template_id", parsed.id, true, Set.of("document_templates"));
            case "tenants" -> referenceCleanupService.clearReferences("tenant_id", parsed.id, true, Set.of("tenants"));
            case "vehicles" -> referenceCleanupService.clearReferences("vehicle_id", parsed.id, true, Set.of("vehicles"));
            default -> {
                return true;
            }
        }

        return true;
    }

    private ParsedDeleteRequest parseDeleteRequest(String uri) {
        if (uri == null || uri.isBlank()) {
            return null;
        }

        String[] parts = uri.split("/");
        if (parts.length < 3) {
            return null;
        }

        String resource;
        String idPart;

        if ("api".equals(parts[1]) && parts.length >= 4) {
            resource = parts[2];
            idPart = parts[3];
        } else {
            resource = parts[1];
            idPart = parts[2];
        }

        try {
            return new ParsedDeleteRequest(resource, Long.parseLong(idPart));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private record ParsedDeleteRequest(String resource, Long id) {
    }
}
