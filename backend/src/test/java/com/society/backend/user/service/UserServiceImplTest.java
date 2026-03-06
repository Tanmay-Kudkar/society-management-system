package com.society.backend.user.service;

import com.society.backend.user.dto.UserRequest;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.PasswordResetTokenRepository;
import com.society.backend.service.common.ReferenceCleanupService;
import com.society.backend.ticket.repository.ComplaintRepository;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.ticket.repository.TicketRepository;
import com.society.backend.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private SocietyRepository societyRepository;

    @Mock
    private FlatRepository flatRepository;

    @Mock
    private ReferenceCleanupService referenceCleanupService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        setCurrentAuth("SOCIETY_ADMIN", "admin@society.com");
        lenient().when(passwordEncoder.encode(any())).thenReturn("encoded-password");
        lenient().when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        User currentUser = new User();
        currentUser.setId(900L);
        currentUser.setEmail("admin@society.com");
        currentUser.setRole(Role.SOCIETY_ADMIN);

        Society currentSociety = new Society();
        currentSociety.setId(1L);
        currentSociety.setName("Alpha Society");
        currentUser.setSociety(currentSociety);

        lenient().when(userRepository.findByEmailWithSocietyAndFlat("admin@society.com")).thenReturn(Optional.of(currentUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createUser_chairmanWithoutFlat_throwsBadRequest() {
        UserRequest request = baseRequest("chairman.one@society.com", "CHAIRMAN");
        request.setFlatId(null);

        ApiException ex = assertThrows(ApiException.class, () -> userService.createUser(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Flat/Unit assignment is required for MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE roles", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_secretaryWithoutFlat_throwsBadRequest() {
        UserRequest request = baseRequest("secretary.one@society.com", "SECRETARY");
        request.setFlatId(null);

        ApiException ex = assertThrows(ApiException.class, () -> userService.createUser(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Flat/Unit assignment is required for MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE roles", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_treasurerWithoutFlat_throwsBadRequest() {
        UserRequest request = baseRequest("treasurer.one@society.com", "TREASURER");
        request.setFlatId(null);

        ApiException ex = assertThrows(ApiException.class, () -> userService.createUser(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Flat/Unit assignment is required for MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE roles", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_employeeWithFlat_throwsBadRequest() {
        UserRequest request = baseRequest("employee.one@society.com", "EMPLOYEE");
        request.setFlatId(77L);

        ApiException ex = assertThrows(ApiException.class, () -> userService.createUser(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("EMPLOYEE role cannot be assigned to a unit", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_committeeWithFlat_assignsFlatAndSavesUser() {
        UserRequest request = baseRequest("committee.one@society.com", "COMMITTEE");
        request.setFlatId(22L);

        Flat flat = new Flat();
        flat.setId(22L);
        flat.setFlatNumber("A-101");

        when(flatRepository.findById(22L)).thenReturn(Optional.of(flat));

        User savedUser = new User();
        savedUser.setId(321L);
        savedUser.setName(request.getName());
        savedUser.setEmail(request.getEmail());
        savedUser.setRole(Role.COMMITTEE);
        savedUser.setFlat(flat);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        userService.createUser(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User captured = userCaptor.getValue();

        assertEquals(Role.COMMITTEE, captured.getRole());
        assertEquals(22L, captured.getFlat().getId());
        verify(flatRepository).save(flat);
    }

    @Test
    void createUser_treasurerWithFlat_assignsFlatAndSavesUser() {
        UserRequest request = baseRequest("treasurer.valid@society.com", "TREASURER");
        request.setFlatId(23L);

        Flat flat = new Flat();
        flat.setId(23L);
        flat.setFlatNumber("B-202");

        when(flatRepository.findById(23L)).thenReturn(Optional.of(flat));

        User savedUser = new User();
        savedUser.setId(322L);
        savedUser.setName(request.getName());
        savedUser.setEmail(request.getEmail());
        savedUser.setRole(Role.TREASURER);
        savedUser.setFlat(flat);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        userService.createUser(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User captured = userCaptor.getValue();

        assertEquals(Role.TREASURER, captured.getRole());
        assertEquals(23L, captured.getFlat().getId());
        verify(flatRepository).save(flat);
    }

    @Test
    void createUser_whenFlatAlreadyAssigned_throwsConflict() {
        UserRequest request = baseRequest("tenant.one@society.com", "TENANT");
        request.setFlatId(22L);

        Flat flat = new Flat();
        flat.setId(22L);
        flat.setFlatNumber("A-101");

        User existingUser = new User();
        existingUser.setId(123L);
        existingUser.setName("Existing Occupant");

        when(flatRepository.findById(22L)).thenReturn(Optional.of(flat));
        when(userRepository.findByFlatId(22L)).thenReturn(java.util.List.of(existingUser));

        ApiException ex = assertThrows(ApiException.class, () -> userService.createUser(request));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Unit A-101 already has an assigned user: Existing Occupant", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUser_whenChangingToOccupiedFlat_throwsConflict() {
        UserRequest request = baseRequest("member.updated@society.com", "MEMBER");
        request.setFlatId(55L);

        User existingUser = new User();
        existingUser.setId(200L);
        existingUser.setEmail("member.updated@society.com");
        existingUser.setName("Member User");
        existingUser.setPhone("9876543210");
        existingUser.setRole(Role.MEMBER);

        Society society = new Society();
        society.setId(1L);
        society.setName("Alpha Society");
        existingUser.setSociety(society);

        Flat targetFlat = new Flat();
        targetFlat.setId(55L);
        targetFlat.setFlatNumber("B-202");

        User occupant = new User();
        occupant.setId(201L);
        occupant.setName("Already Assigned");

        when(userRepository.findById(200L)).thenReturn(Optional.of(existingUser));
        when(flatRepository.findById(55L)).thenReturn(Optional.of(targetFlat));
        when(userRepository.findByFlatId(55L)).thenReturn(java.util.List.of(occupant));

        ApiException ex = assertThrows(ApiException.class, () -> userService.updateUser(200L, request));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Unit B-202 already has an assigned user: Already Assigned", ex.getMessage());
    }

    private static UserRequest baseRequest(String email, String role) {
        UserRequest request = new UserRequest();
        request.setName("Test User");
        request.setEmail(email);
        request.setPassword("secret123");
        request.setPhone("9876543210");
        request.setRole(role);
        return request;
    }

    private static void setCurrentAuth(String role, String email) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                email,
                "password",
                java.util.List.of(() -> "ROLE_" + role)
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
