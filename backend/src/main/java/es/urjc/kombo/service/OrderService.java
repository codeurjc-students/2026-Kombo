package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderMapper;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.KomboUserDetails;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.orderMapper = orderMapper;
    }

    // Employees and the administrator can see every order; a customer only their own orders
    public OrderDTO findById(long id, KomboUserDetails currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " not found"));
        if (currentUser.getRole() == User.Role.CUSTOMER && !isOwner(order, currentUser)) {
            throw new AccessDeniedException("Order " + id + " belongs to another user");
        }
        return orderMapper.toDTO(order);
    }

    // Order history of a user, the most recent first. Who can call it is checked in the controller.
    public Page<OrderDTO> findByUser(long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found"));
        return orderRepository.findByUserOrderByCreatedAtDesc(user, pageable).map(orderMapper::toDTO);
    }

    private boolean isOwner(Order order, KomboUserDetails currentUser) {
        return order.getUser() != null && order.getUser().getId().equals(currentUser.getId());
    }
}
