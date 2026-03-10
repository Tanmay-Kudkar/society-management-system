package com.society.backend.common.config;

import com.society.backend.common.security.CustomUserDetailsService;
import com.society.backend.common.security.JwtAuthenticationEntryPoint;
import com.society.backend.common.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.society.backend.user.entity.User;
import com.society.backend.vendor.entity.Vendor;
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomUserDetailsService userDetailsService;
        private final PasswordEncoder passwordEncoder;
        private final JwtAuthenticationEntryPoint authenticationEntryPoint;
        private final CorsConfigurationSource corsConfigurationSource;

        public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                        CustomUserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder,
                        JwtAuthenticationEntryPoint authenticationEntryPoint,
                        CorsConfigurationSource corsConfigurationSource) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.userDetailsService = userDetailsService;
                this.passwordEncoder = passwordEncoder;
                this.authenticationEntryPoint = authenticationEntryPoint;
                this.corsConfigurationSource = corsConfigurationSource;
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder);
                return authProvider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .csrf(csrf -> csrf.disable())
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(authenticationEntryPoint))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Public endpoints
                                                .requestMatchers("/auth/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/health").permitAll()
                                                .requestMatchers("/api/test/**").permitAll() // Test endpoints (remove
                                                                                             // in production)
                                                .requestMatchers(HttpMethod.POST, "/enquiries").permitAll() // Landing page enrolment form

                                                // ==================== MASTER_ADMIN ONLY ====================
                                                .requestMatchers("/api/platform/**").hasRole("MASTER_ADMIN")

                                                // ==================== SOCIETY_ADMIN & ABOVE ====================
                                                .requestMatchers("/societies/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN")
                                                // User creation/deletion - roles allowed based on RolePermissions
                                                // hierarchy
                                                .requestMatchers(HttpMethod.POST, "/users/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers(HttpMethod.DELETE, "/users/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/api/reports/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "MANAGER")
                                                .requestMatchers("/api/export/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")

                                                // ==================== FINANCIAL OPERATIONS ====================
                                                .requestMatchers(HttpMethod.POST, "/contracts/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY")
                                                .requestMatchers(HttpMethod.DELETE, "/contracts/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY")

                                                // ==================== NOTICES ====================
                                                .requestMatchers(HttpMethod.POST, "/notices/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "MANAGER")
                                                .requestMatchers(HttpMethod.PUT, "/notices/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "MANAGER")
                                                .requestMatchers(HttpMethod.DELETE, "/notices/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "MANAGER")

                                                // ==================== FINANCE ====================
                                                .requestMatchers("/transactions/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER")
                                                .requestMatchers(HttpMethod.POST, "/maintenance-bills/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER")
                                                .requestMatchers(HttpMethod.PUT, "/maintenance-bills/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER")
                                                .requestMatchers(HttpMethod.DELETE, "/maintenance-bills/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER")

                                                // ==================== VENDORS ====================
                                                .requestMatchers("/vendors/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "MANAGER")
                                                .requestMatchers("/vendor-bills/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")
                                                .requestMatchers(HttpMethod.PUT, "/contracts/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE")
                                                .requestMatchers(HttpMethod.GET, "/contracts/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")
                                                .requestMatchers(HttpMethod.PUT, "/users/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")

                                                // ==================== DATA MANAGEMENT ====================
                                                .requestMatchers("/flats/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/api/wings/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "MANAGER", "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/document-templates/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE")
                                                .requestMatchers(HttpMethod.POST, "/emergency-contacts/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.PUT, "/emergency-contacts/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE", "MANAGER",
                                                                "EMPLOYEE")
                                                .requestMatchers(HttpMethod.DELETE, "/emergency-contacts/**")
                                                .authenticated()

                                                // ==================== MEMBER LEVEL ====================
                                                .requestMatchers("/tenants/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/vehicles/**")
                                                .hasAnyRole("MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")

                                                // ==================== ALL AUTHENTICATED USERS ====================
                                                // View notices, emergency contacts, own maintenance bills
                                                .requestMatchers(HttpMethod.GET, "/notices/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/emergency-contacts/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/maintenance-bills/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/users/**").authenticated()

                                                // Tickets and complaints (any authenticated user can create/view)
                                                .requestMatchers("/tickets/**").authenticated()
                                                .requestMatchers("/complaints/**").authenticated()

                                                // Any other request requires authentication
                                                // Explicitly deny VISITOR and VENDOR from general endpoints
                                                .anyRequest().hasAnyRole(
                                                                "MASTER_ADMIN", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER",
                                                                "COMMITTEE", "MANAGER", "EMPLOYEE",
                                                                "MEMBER", "TENANT"))
                                .authenticationProvider(authenticationProvider())
                                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
