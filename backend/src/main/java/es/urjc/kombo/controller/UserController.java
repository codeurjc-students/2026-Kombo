package es.urjc.kombo.controller;

import java.net.URI;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.AddressesUpdateDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.PasswordChangeDTO;
import es.urjc.kombo.dto.ProfileUpdateDTO;
import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.security.JwtService;
import es.urjc.kombo.security.KomboUserDetails;
import es.urjc.kombo.service.OrderService;
import es.urjc.kombo.service.UserService;
import jakarta.validation.Valid;

// Each user manages their own account with the /me paths; the /{id} paths are only for the administrator,
// who can see and change the account of any user
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final String ADMIN_ONLY = "hasRole('ADMIN')";

    private final UserService userService;
    private final OrderService orderService;
    private final JwtService jwtService;

    public UserController(UserService userService, OrderService orderService, JwtService jwtService) {
        this.userService = userService;
        this.orderService = orderService;
        this.jwtService = jwtService;
    }

    // Only the administrator (rule in SecurityConfig)
    @GetMapping
    public PagedModel<UserDTO> getUsers(@PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return new PagedModel<>(userService.findAll(pageable));
    }

    // Sign up of a new customer (public, rule in SecurityConfig). Answers 201 with the new user and its URL
    // in the Location header, 400 if a field is not valid and 409 if the email is already registered.
    // It does not log in: the client calls POST /api/v1/auth/login afterwards.
    @PostMapping
    public ResponseEntity<UserDTO> signUp(@Valid @RequestBody SignUpRequestDTO request) {
        UserDTO user = userService.signUp(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.id()).toUri();
        return ResponseEntity.created(location).body(user);
    }

    // Order history of the logged in user, the most recent first (any role; 401 without session)
    @GetMapping("/me/orders")
    public PagedModel<OrderDTO> getMyOrders(@AuthenticationPrincipal KomboUserDetails user,
            @PageableDefault(size = 10) Pageable pageable) {
        return new PagedModel<>(orderService.findByUser(user.getId(), pageable));
    }

    // Personal data of the logged in user (any role). Answers 400 if a field is not valid.
    @PutMapping("/me")
    public UserDTO updateMyProfile(@AuthenticationPrincipal KomboUserDetails user,
            @Valid @RequestBody ProfileUpdateDTO profile) {
        return userService.updateProfile(user.getId(), profile);
    }

    // Password of the logged in user. Answers 204, or 400 if the current password is wrong or the new one is
    // not valid.
    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(@AuthenticationPrincipal KomboUserDetails user,
            @Valid @RequestBody PasswordChangeDTO passwords) {
        userService.changePassword(user.getId(), passwords);
        return ResponseEntity.noContent().build();
    }

    // Saved addresses of the logged in user: the request has the whole list, so it adds and deletes addresses
    @PutMapping("/me/addresses")
    public UserDTO updateMyAddresses(@AuthenticationPrincipal KomboUserDetails user,
            @Valid @RequestBody AddressesUpdateDTO request) {
        return userService.updateAddresses(user.getId(), request);
    }

    // Profile picture of the logged in user, uploaded as multipart/form-data in the field "image".
    // Answers 400 if the file is not a JPEG, PNG, GIF or WebP picture and 413 if it is bigger than 1 MB.
    @PutMapping(path = "/me/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDTO updateMyImage(@AuthenticationPrincipal KomboUserDetails user,
            @RequestParam("image") MultipartFile image) {
        return userService.updateImage(user.getId(), image);
    }

    @GetMapping("/me/image")
    public ResponseEntity<Resource> getMyImage(@AuthenticationPrincipal KomboUserDetails user) {
        return imageResponse(userService.findImage(user.getId()));
    }

    @DeleteMapping("/me/image")
    public ResponseEntity<Void> deleteMyImage(@AuthenticationPrincipal KomboUserDetails user) {
        userService.deleteImage(user.getId());
        return ResponseEntity.noContent().build();
    }

    // Deletes the account of the logged in user and closes the session (403 for the administrator)
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(@AuthenticationPrincipal KomboUserDetails user) {
        userService.deleteAccount(user.getId());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, jwtService.deleteCookie().toString())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize(ADMIN_ONLY)
    public UserDTO getUser(@PathVariable long id) {
        return userService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize(ADMIN_ONLY)
    public UserDTO updateUser(@PathVariable long id, @Valid @RequestBody ProfileUpdateDTO profile) {
        return userService.updateProfile(id, profile);
    }

    // Deletes any account except the one of the administrator (403)
    @DeleteMapping("/{id}")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<Void> deleteUser(@PathVariable long id) {
        userService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/addresses")
    @PreAuthorize(ADMIN_ONLY)
    public UserDTO updateUserAddresses(@PathVariable long id, @Valid @RequestBody AddressesUpdateDTO request) {
        return userService.updateAddresses(id, request);
    }

    @PutMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(ADMIN_ONLY)
    public UserDTO updateUserImage(@PathVariable long id, @RequestParam("image") MultipartFile image) {
        return userService.updateImage(id, image);
    }

    @GetMapping("/{id}/image")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<Resource> getUserImage(@PathVariable long id) {
        return imageResponse(userService.findImage(id));
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<Void> deleteUserImage(@PathVariable long id) {
        userService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    // Order history of any user, the most recent first
    @GetMapping("/{id}/orders")
    @PreAuthorize(ADMIN_ONLY)
    public PagedModel<OrderDTO> getUserOrders(@PathVariable long id,
            @PageableDefault(size = 10) Pageable pageable) {
        return new PagedModel<>(orderService.findByUser(id, pageable));
    }

    // The picture as binary content with its type. no-cache: the browser asks again every time, so a new picture
    // is shown at once with the same URL.
    private static ResponseEntity<Resource> imageResponse(ImageFileDTO image) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(image.content());
    }
}
