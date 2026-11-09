package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.dto.UserMapper;
import es.urjc.kombo.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public UserDTO findById(long id) {
        return userRepository.findById(id)
                .map(userMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User " + id + " not found"));
    }

    public Page<UserDTO> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDTO);
    }
}
