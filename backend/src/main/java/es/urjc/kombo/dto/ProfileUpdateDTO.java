package es.urjc.kombo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Body of PUT /api/v1/users/me and PUT /api/v1/users/{id}: the personal data a user can change.
// Same rules as the sign up (SignUpRequestDTO). The email is not included: it identifies the session.
public record ProfileUpdateDTO(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 100) String surname,
        @Pattern(regexp = "^$|^\\+?[0-9 ]{9,15}$", message = "must be a phone number of 9 to 15 digits") String phone
) {
}
