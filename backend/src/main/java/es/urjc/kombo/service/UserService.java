package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.dto.UserMapper;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO findById(long id) {
        return userRepository.findById(id)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User " + id + " not found"));
    }

    public Page<UserDTO> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDTO);
    }

    // Sign up: always creates a customer, with the password encoded with BCrypt.
    // The email column is also unique in the database, which protects against two sign ups at the same time.
    @Transactional
    public UserDTO signUp(SignUpRequestDTO request) {
        String email = request.email().trim();
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException(email);
        }
        User user = new User(request.name().trim(), blankToNull(request.surname()), email,
                blankToNull(request.phone()), passwordEncoder.encode(request.password()), User.Role.CUSTOMER);
        return userMapper.toDTO(userRepository.save(user));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
