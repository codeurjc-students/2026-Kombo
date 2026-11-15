package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderLineRequestDTO;
import es.urjc.kombo.dto.OrderMapper;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.KomboUserDetails;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SettingsService settingsService;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository,
            ProductRepository productRepository, SettingsService settingsService, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.settingsService = settingsService;
        this.orderMapper = orderMapper;
    }

    // Places an order from the checkout. The prices come from the database (never from the client) and are
    // copied into the lines; the delivery cost comes from the settings. currentUser is null for anonymous users;
    // the order of a customer is saved in their history, and an employee places counter orders without a user.
    // The payment is simulated: a card payment is always accepted, and cash is paid when the order is collected.
    @Transactional
    public OrderDTO create(OrderRequestDTO request, KomboUserDetails currentUser) {
        Order order = new Order(customerOf(currentUser), request.deliveryType(), request.paymentMethod());
        for (OrderLineRequestDTO line : request.lines()) {
            order.addLine(findProductOnTheMenu(line.productId()), line.quantity());
        }
        if (request.deliveryType() == Order.DeliveryType.DELIVERY) {
            if (request.deliveryAddress() == null || request.deliveryAddress().isBlank()) {
                throw new InvalidOrderException("deliveryAddress: is required for home deliveries");
            }
            order.setDeliveryAddress(request.deliveryAddress().trim());
        }
        order.setDeliveryCost(settingsService.findSettings().deliveryCostFor(request.deliveryType(), order.getSubtotal()));
        order.setCustomerName(request.customerName().trim());
        order.setCustomerEmail(request.customerEmail().trim());
        order.setCustomerPhone(request.customerPhone().trim());
        order.setPaid(request.paymentMethod() == Order.PaymentMethod.CARD);

        Order saved = orderRepository.save(order);
        saved.assignOrderNumber();
        return orderMapper.toDTO(saved);
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

    private User customerOf(KomboUserDetails currentUser) {
        if (currentUser == null || currentUser.getRole() != User.Role.CUSTOMER) {
            return null;
        }
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User " + currentUser.getId() + " not found"));
    }

    private Product findProductOnTheMenu(long productId) {
        return productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new InvalidOrderException("Product " + productId + " is not on the menu"));
    }

    private boolean isOwner(Order order, KomboUserDetails currentUser) {
        return order.getUser() != null && order.getUser().getId().equals(currentUser.getId());
    }
}
