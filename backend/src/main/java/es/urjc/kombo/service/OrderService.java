package es.urjc.kombo.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderLineRequestDTO;
import es.urjc.kombo.dto.OrderMapper;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.dto.OrderUpdateDTO;
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
    // the order of a customer is saved in their history (and a new delivery address in their profile), and an
    // employee places counter orders without a user.
    // The payment is simulated: a card payment is always accepted, and cash is paid when the order is collected.
    @Transactional
    public OrderDTO create(OrderRequestDTO request, KomboUserDetails currentUser) {
        Order order = new Order(customerOf(currentUser), request.deliveryType(), request.paymentMethod());
        setContactData(order, request, isEmployee(currentUser));
        for (OrderLineRequestDTO line : request.lines()) {
            order.addLine(findProductOnTheMenu(line.productId()), line.quantity());
        }
        if (request.deliveryType() == Order.DeliveryType.DELIVERY) {
            if (request.deliveryAddress() == null || request.deliveryAddress().isBlank()) {
                throw new InvalidOrderException("deliveryAddress: is required for home deliveries");
            }
            String address = request.deliveryAddress().trim();
            order.setDeliveryAddress(address);
            saveNewAddress(order.getUser(), address);
        }
        order.setDeliveryCost(settingsService.findSettings().deliveryCostFor(request.deliveryType(), order.getSubtotal()));
        order.setPaid(request.paymentMethod() == Order.PaymentMethod.CARD);

        Order saved = orderRepository.save(order);
        saved.assignOrderNumber();
        return orderMapper.toDTO(saved);
    }

    // Orders of the dashboard of the employees: the orders in any of the statuses (all of them without statuses),
    // placed from since (any time when it is null), one page at a time in the order of the Pageable (the controller
    // sorts them by age). The filters are applied by the database.
    public Page<OrderDTO> findByStatus(List<Order.OrderStatus> statuses, LocalDateTime since, Pageable pageable) {
        boolean allStatuses = statuses == null || statuses.isEmpty();
        Page<Order> orders;
        if (since == null) {
            orders = allStatuses
                    ? orderRepository.findAll(pageable)
                    : orderRepository.findByStatusIn(statuses, pageable);
        } else {
            orders = allStatuses
                    ? orderRepository.findByCreatedAtGreaterThanEqual(since, pageable)
                    : orderRepository.findByStatusInAndCreatedAtGreaterThanEqual(statuses, since, pageable);
        }
        return orders.map(orderMapper::toDTO);
    }

    // Employees and the administrator change the status of an order and mark a cash order as paid.
    // The status only moves forward: in preparation -> ready -> delivered, or cancelled before it is delivered.
    // An order is delivered only when it is paid, and only cash orders are marked as paid (card orders already are).
    @Transactional
    public OrderDTO update(long id, OrderUpdateDTO changes) {
        if (changes.status() == null && changes.paid() == null) {
            throw new InvalidOrderException("status or paid: at least one of them is required");
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " not found"));
        if (changes.paid() != null) {
            markPaid(order, changes.paid());
        }
        if (changes.status() != null && changes.status() != order.getStatus()) {
            changeStatus(order, changes.status());
        }
        return orderMapper.toDTO(order);
    }

    private static void markPaid(Order order, boolean paid) {
        if (!paid) {
            throw new InvalidOrderException("paid: a paid order cannot be marked as not paid");
        }
        if (order.isPaid()) {
            return;
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new OrderStatusException("Order " + order.getId() + " is cancelled and cannot be paid");
        }
        order.setPaid(true);
    }

    private static void changeStatus(Order order, Order.OrderStatus status) {
        if (!canChange(order.getStatus(), status)) {
            throw new OrderStatusException("Order " + order.getId() + " cannot change from " + order.getStatus()
                    + " to " + status);
        }
        if (status == Order.OrderStatus.DELIVERED) {
            if (!order.isPaid()) {
                throw new OrderStatusException("Order " + order.getId() + " must be paid before it is delivered");
            }
            order.setDeliveredAt(LocalDateTime.now(ZoneId.systemDefault()));
        }
        // The restaurant cancels without a fee: a paid order is given back in full
        if (status == Order.OrderStatus.CANCELLED) {
            order.setCancellationFee(BigDecimal.ZERO);
        }
        order.setStatus(status);
    }

    // A customer cancels one of their orders while it is in preparation or ready; the only change they can send is
    // the status CANCELLED (403 for anything else and for the orders of other users, 409 for any other status).
    // A paid order that is already ready keeps a fee (the percentage of the total in the settings) and gives back
    // the rest; an order in preparation, or one that is not paid yet, keeps nothing.
    @Transactional
    public OrderDTO cancelByCustomer(long id, OrderUpdateDTO changes, KomboUserDetails currentUser) {
        if (changes.status() != Order.OrderStatus.CANCELLED || changes.paid() != null) {
            throw new AccessDeniedException("A customer can only cancel their orders");
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " not found"));
        if (!isOwner(order, currentUser)) {
            throw new AccessDeniedException("Order " + id + " belongs to another user");
        }
        Order.OrderStatus status = order.getStatus();
        if (status != Order.OrderStatus.IN_PREPARATION && status != Order.OrderStatus.READY) {
            throw new OrderStatusException("Order " + id + " cannot be cancelled when it is " + status);
        }
        BigDecimal fee = status == Order.OrderStatus.READY && order.isPaid()
                ? settingsService.findSettings().cancellationFeeFor(order.getTotal())
                : BigDecimal.ZERO;
        order.setCancellationFee(fee);
        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderMapper.toDTO(order);
    }

    private static boolean canChange(Order.OrderStatus from, Order.OrderStatus to) {
        return switch (from) {
            case IN_PREPARATION -> to == Order.OrderStatus.READY || to == Order.OrderStatus.CANCELLED;
            case READY -> to == Order.OrderStatus.DELIVERED || to == Order.OrderStatus.CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    // The name is always required. Customers and anonymous users also give an email; an employee who places a
    // counter order may leave it empty. The phone is required for home deliveries, whoever places the order, and
    // optional for the orders collected or eaten at the restaurant.
    private static void setContactData(Order order, OrderRequestDTO request, boolean counterOrder) {
        String email = blankToNull(request.customerEmail());
        String phone = blankToNull(request.customerPhone());
        if (!counterOrder && email == null) {
            throw new InvalidOrderException("customerEmail: is required");
        }
        if (request.deliveryType() == Order.DeliveryType.DELIVERY && phone == null) {
            throw new InvalidOrderException("customerPhone: is required for home deliveries");
        }
        order.setCustomerName(request.customerName().trim());
        order.setCustomerEmail(email);
        order.setCustomerPhone(phone);
    }

    private static boolean isEmployee(KomboUserDetails currentUser) {
        return currentUser != null && currentUser.getRole() == User.Role.EMPLOYEE;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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

    // A customer who delivers to a new address keeps it in their profile, so it can be chosen next time
    private static void saveNewAddress(User customer, String address) {
        if (customer != null && !customer.getAddresses().contains(address)) {
            customer.addAddress(address);
        }
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
