package com.society.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.cors.allowed-origins:}")
    private String configuredAllowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = new ArrayList<>(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
        ));

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            allowedOrigins.add(frontendUrl.trim());
        }

        if (configuredAllowedOrigins != null && !configuredAllowedOrigins.isBlank()) {
            Arrays.stream(configuredAllowedOrigins.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .forEach(allowedOrigins::add);
        }

        configuration.setAllowedOrigins(allowedOrigins.stream().distinct().toList());
        
        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Allow all headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow credentials (for JWT tokens)
        configuration.setAllowCredentials(true);
        
        // Expose authorization header to frontend
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        
        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
