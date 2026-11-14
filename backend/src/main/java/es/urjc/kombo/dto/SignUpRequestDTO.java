package es.urjc.kombo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Body of POST /api/v1/users (sign up). Surname and phone are optional.
// BCrypt only uses the first 72 bytes of a password, so longer passwords are rejected.
public record SignUpRequestDTO(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 100) String surname,
        @NotBlank @Email @Size(max = 100) String email,
        @Pattern(regexp = "^$|^\\+?[0-9 ]{9,15}$", message = "must be a phone number of 9 to 15 digits") String phone,
        @NotBlank @Size(min = 8, max = 72) String password
) {
}
