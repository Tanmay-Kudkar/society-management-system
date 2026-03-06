package com.society.backend.config;

import com.society.backend.security.CustomUserDetailsService;
import com.society.backend.security.JwtAuthenticationEntryPoint;
import com.society.backend.security.JwtAuthenticationFilter;
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

                                                // ==================== PLATFORM_OWNER ONLY ====================
                                                .requestMatchers("/organizations/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER")
                                                .requestMatchers("/api/platform/**").hasRole("PLATFORM_OWNER")

                                                // ==================== SOCIETY_ADMIN & ABOVE ====================
                                                .requestMatchers("/societies/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN")
                                                // User creation/deletion - roles allowed based on RolePermissions
                                                // hierarchy
                                                .requestMatchers(HttpMethod.POST, "/users/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers(HttpMethod.DELETE, "/users/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/api/reports/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN")
                                                .requestMatchers("/api/export/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER")

                                                // ==================== CHAIRMAN LEVEL ====================
                                                // Financial approvals, high-value decisions
                                                .requestMatchers(HttpMethod.POST, "/contracts/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN")
                                                .requestMatchers(HttpMethod.DELETE, "/contracts/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN")

                                                // ==================== SECRETARY LEVEL ====================
                                                // Administrative tasks, notices, meetings
                                                .requestMatchers(HttpMethod.POST, "/notices/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY")
                                                .requestMatchers(HttpMethod.PUT, "/notices/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY")
                                                .requestMatchers(HttpMethod.DELETE, "/notices/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY")

                                                // ==================== TREASURER LEVEL ====================
                                                // Financial operations, bills, transactions
                                                .requestMatchers("/transactions/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER")
                                                .requestMatchers(HttpMethod.POST, "/maintenance-bills/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER")
                                                .requestMatchers(HttpMethod.PUT, "/maintenance-bills/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER")
                                                .requestMatchers(HttpMethod.DELETE, "/maintenance-bills/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER")

                                                // ==================== COMMITTEE LEVEL ====================
                                                // Vendors, contracts (view/update), banners, documents
                                                .requestMatchers("/vendors/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")
                                                .requestMatchers("/vendor-bills/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "TREASURER", "COMMITTEE", "VENDOR")
                                                .requestMatchers(HttpMethod.PUT, "/contracts/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE")
                                                .requestMatchers(HttpMethod.GET, "/contracts/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE")
                                                .requestMatchers("/banners/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE")
                                                .requestMatchers(HttpMethod.PUT, "/users/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE")

                                                // ==================== EMPLOYEE LEVEL ====================
                                                // Flats, documents, emergency contacts management
                                                // MEMBER needs access to flats for tenant assignment
                                                .requestMatchers("/flats/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/api/wings/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/document-templates/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE")
                                                // Emergency contacts - allow any member to create (for their own
                                                // contacts)
                                                .requestMatchers(HttpMethod.POST, "/emergency-contacts/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.PUT, "/emergency-contacts/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "COMMITTEE", "EMPLOYEE")
                                                // Allow any authenticated user to delete (service layer checks
                                                // ownership)
                                                .requestMatchers(HttpMethod.DELETE, "/emergency-contacts/**")
                                                .authenticated()

                                                // ==================== MEMBER LEVEL ====================
                                                // Tenants, vehicles (for their own flats)
                                                .requestMatchers("/tenants/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
                                                                "CHAIRMAN", "SECRETARY", "TREASURER", "COMMITTEE",
                                                                "EMPLOYEE", "MEMBER")
                                                .requestMatchers("/vehicles/**")
                                                .hasAnyRole("PLATFORM_OWNER", "ORGANIZATION_OWNER", "SOCIETY_ADMIN",
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
                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
