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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationEntryPoint = authenticationEntryPoint;
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
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Master Admin only endpoints
                        .requestMatchers("/societies/**").hasRole("MASTER_ADMIN")

                        // Admin and Committee can manage users
                        .requestMatchers(HttpMethod.POST, "/users/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers(HttpMethod.PUT, "/users/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers(HttpMethod.DELETE, "/users/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")

                        // Admin, Committee, and Employee can manage flats
                        .requestMatchers("/flats/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")

                        // Admin, Committee can manage vendors and contracts
                        .requestMatchers("/vendors/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers("/vendor-bills/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers("/contracts/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")

                        // Admin, Committee can manage maintenance
                        .requestMatchers(HttpMethod.POST, "/maintenance-bills/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers(HttpMethod.PUT, "/maintenance-bills/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE")
                        .requestMatchers(HttpMethod.DELETE, "/maintenance-bills/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE")

                        // Admin, Committee can manage transactions
                        .requestMatchers("/transactions/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")

                        // Admin, Committee, Employee can create notices
                        .requestMatchers(HttpMethod.POST, "/notices/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/notices/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.DELETE, "/notices/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")

                        // Admin, Committee can manage banners
                        .requestMatchers("/banners/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE")

                        // Admin, Committee, Employee can manage documents
                        .requestMatchers("/documents/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")

                        // Admin, Committee, Employee can manage emergency contacts
                        .requestMatchers(HttpMethod.POST, "/emergency-contacts/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/emergency-contacts/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.DELETE, "/emergency-contacts/**")
                        .hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE")

                        // All authenticated users can view notices, emergency contacts
                        .requestMatchers(HttpMethod.GET, "/notices/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/emergency-contacts/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/maintenance-bills/**").authenticated()

                        // All authenticated users can create and view tickets/complaints
                        .requestMatchers("/tickets/**").authenticated()
                        .requestMatchers("/complaints/**").authenticated()

                        // All authenticated users can view/update their own profile
                        .requestMatchers(HttpMethod.GET, "/users/**").authenticated()

                        // Tenants and vehicles
                        .requestMatchers("/tenants/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE", "MEMBER")
                        .requestMatchers("/vehicles/**").hasAnyRole("MASTER_ADMIN", "COMMITTEE", "EMPLOYEE", "MEMBER")

                        // Any other request requires authentication
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
