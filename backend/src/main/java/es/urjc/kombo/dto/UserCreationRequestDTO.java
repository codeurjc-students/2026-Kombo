package es.urjc.kombo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Body of POST /api/v1/admin/users: the administrator creates a customer or an employee. Same rules as the
// sign up (SignUpRequestDTO) plus the role, which cannot be ADMIN because there is only one administrator.
public record UserCreationRequestDTO(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 100) String surname,
        @NotBlank @Email @Size(max = 100) String email,
        @Pattern(regexp = "^$|^\\+?[0-9 ]{9,15}$", message = "must be a phone number of 9 to 15 digits") String phone,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull @Pattern(regexp = "CUSTOMER|EMPLOYEE", message = "must be CUSTOMER or EMPLOYEE") String role
) {
}
