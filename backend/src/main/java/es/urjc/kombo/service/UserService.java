package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import es.urjc.kombo.dto.AddressesUpdateDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.PasswordChangeDTO;
import es.urjc.kombo.dto.ProfileUpdateDTO;
import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.dto.UserMapper;
import es.urjc.kombo.model.Image;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ImageService imageService;
    private final OrderRepository orderRepository;

    public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
            ImageService imageService, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.imageService = imageService;
        this.orderRepository = orderRepository;
    }

    public UserDTO findById(long id) {
        return userMapper.toDTO(findUser(id));
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

    // Changes the personal data of a user (the user themselves or the administrator). The email cannot change.
    @Transactional
    public UserDTO updateProfile(long id, ProfileUpdateDTO profile) {
        User user = findUser(id);
        user.setName(profile.name().trim());
        user.setSurname(blankToNull(profile.surname()));
        user.setPhone(blankToNull(profile.phone()));
        return userMapper.toDTO(user);
    }

    // Changes the password of a user, who must give the current one; the new one is stored encoded with BCrypt
    @Transactional
    public void changePassword(long id, PasswordChangeDTO passwords) {
        User user = findUser(id);
        if (!passwordEncoder.matches(passwords.currentPassword(), user.getPassword())) {
            throw new WrongPasswordException();
        }
        user.setPassword(passwordEncoder.encode(passwords.newPassword()));
    }

    // Replaces the saved addresses of a user. Blank spaces around them are removed and repeated ones are kept once,
    // in the order received.
    @Transactional
    public UserDTO updateAddresses(long id, AddressesUpdateDTO request) {
        User user = findUser(id);
        user.replaceAddresses(request.addresses().stream().map(String::trim).distinct().toList());
        return userMapper.toDTO(user);
    }

    // Uploads or replaces the profile picture of a user (the previous one is deleted: orphanRemoval).
    // flush saves the new picture now, so the answer already has its id.
    @Transactional
    public UserDTO updateImage(long id, MultipartFile file) {
        User user = findUser(id);
        user.setImage(imageService.createImage(file, user.getName()));
        userRepository.flush();
        return userMapper.toDTO(user);
    }

    // The binary content of the picture is read inside the transaction
    public ImageFileDTO findImage(long id) {
        Image image = findUser(id).getImage();
        if (image == null) {
            throw new ResourceNotFoundException("User " + id + " has no image");
        }
        return imageService.toFile(image);
    }

    @Transactional
    public void deleteImage(long id) {
        findUser(id).setImage(null);
    }

    // Deletes a user with their addresses and picture. Their orders are kept for the sales, without the user and
    // the customer data. The account of the administrator cannot be deleted.
    @Transactional
    public void deleteAccount(long id) {
        User user = findUser(id);
        if (user.getRole() == User.Role.ADMIN) {
            throw new AccessDeniedException("The account of the administrator cannot be deleted");
        }
        orderRepository.anonymizeOrdersOf(user);
        userRepository.delete(user);
    }

    private User findUser(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User " + id + " not found"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
