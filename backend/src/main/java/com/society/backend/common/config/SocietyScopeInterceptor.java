package com.society.backend.common.config;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.service.RoleService;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SocietyScopeInterceptor implements HandlerInterceptor {

    private static final String PARAM_SOCIETY_ID = "societyId";
    private static final String PARAM_SOCIETY = "society";

    private final RoleService roleService;
    private final SocietyRepository societyRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Long requestedSocietyId = extractRequestedSocietyId(request);
        if (requestedSocietyId == null) {
            return true;
        }

        User currentUser = roleService.getCurrentUser();
        if (currentUser == null) {
            return true;
        }

        if (!societyRepository.existsById(requestedSocietyId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Society not found");
        }

        roleService.enforceSocietyScope(currentUser, requestedSocietyId);
        return true;
    }

    private Long extractRequestedSocietyId(HttpServletRequest request) {
        Long fromQuery = parseLong(request.getParameter(PARAM_SOCIETY_ID));
        if (fromQuery != null) {
            return fromQuery;
        }

        Long fromAliasQuery = parseLong(request.getParameter(PARAM_SOCIETY));
        if (fromAliasQuery != null) {
            return fromAliasQuery;
        }

        Object pathVarsAttribute = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (pathVarsAttribute instanceof Map<?, ?> rawPathVars) {
            Long fromPath = parseLong(String.valueOf(rawPathVars.get(PARAM_SOCIETY_ID)));
            if (fromPath != null) {
                return fromPath;
            }

            Long fromAliasPath = parseLong(String.valueOf(rawPathVars.get(PARAM_SOCIETY)));
            if (fromAliasPath != null) {
                return fromAliasPath;
            }
        }

        return extractSocietyIdFromSocietiesRoute(request.getRequestURI());
    }

    private Long extractSocietyIdFromSocietiesRoute(String uri) {
        if (uri == null || !uri.startsWith("/societies/")) {
            return null;
        }

        String[] parts = uri.split("/");
        if (parts.length < 3) {
            return null;
        }

        return parseLong(parts[2]);
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) {
            return null;
        }

        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid society id in request");
        }
    }
}