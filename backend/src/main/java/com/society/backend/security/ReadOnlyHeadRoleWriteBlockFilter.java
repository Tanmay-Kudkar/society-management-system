package com.society.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class ReadOnlyHeadRoleWriteBlockFilter extends OncePerRequestFilter {

    private static final Set<String> READ_ONLY_HEAD_AUTHORITIES = Set.of(
            "ROLE_CHAIRMAN",
            "ROLE_SECRETARY",
            "ROLE_TREASURER");

    private static final Set<String> MUTATING_METHODS = Set.of(
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name());

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (isMutatingRequest(request.getMethod()) && isReadOnlyHeadRole()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Access denied\",\"message\":\"Read-only role cannot perform write operations\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isMutatingRequest(String method) {
        return MUTATING_METHODS.contains(method);
    }

    private boolean isReadOnlyHeadRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getAuthorities() == null) {
            return false;
        }

        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (READ_ONLY_HEAD_AUTHORITIES.contains(authority.getAuthority())) {
                return true;
            }
        }

        return false;
    }
}
