package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderLineRequestDTO;
import es.urjc.kombo.dto.OrderMapper;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.dto.OrderUpdateDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.model.Settings;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.KomboUserDetails;

// Ownership rule and creation of the orders, with the repositories mocked
class OrderServiceTest {

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final SettingsService settingsService = mock(SettingsService.class);
    private final OrderMapper orderMapper = mock(OrderMapper.class);
    private final OrderService orderService = new OrderService(orderRepository, userRepository, productRepository,
            settingsService, orderMapper);

    private User owner;
    private User otherCustomer;
    private Order order;

    @BeforeEach
    void setUp() {
        owner = user(1L, User.Role.CUSTOMER);
        otherCustomer = user(2L, User.Role.CUSTOMER);
        order = new Order(owner, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CARD);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderMapper.toDTO(any())).thenReturn(mock(OrderDTO.class));
    }

    @Test
    void theOwnerReadsTheOrder() {
        assertThat(orderService.findById(10L, new KomboUserDetails(owner))).isNotNull();
    }

    @Test
    void anotherCustomerCannotReadTheOrder() {
        KomboUserDetails other = new KomboUserDetails(otherCustomer);

        assertThatThrownBy(() -> orderService.findById(10L, other)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void aCustomerCannotReadAnAnonymousOrder() {
        Order anonymous = new Order(null, Order.DeliveryType.EAT_IN, Order.PaymentMethod.CASH);
        when(orderRepository.findById(11L)).thenReturn(Optional.of(anonymous));
        KomboUserDetails customer = new KomboUserDetails(owner);

        assertThatThrownBy(() -> orderService.findById(11L, customer)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void employeesAndTheAdministratorReadAnyOrder() {
        assertThat(orderService.findById(10L, new KomboUserDetails(user(3L, User.Role.EMPLOYEE)))).isNotNull();
        assertThat(orderService.findById(10L, new KomboUserDetails(user(4L, User.Role.ADMIN)))).isNotNull();
    }

    @Test
    void anOrderThatDoesNotExistThrowsNotFound() {
        KomboUserDetails customer = new KomboUserDetails(owner);

        assertThatThrownBy(() -> orderService.findById(99L, customer))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // Placing orders

    @Test
    void createCopiesThePricesAndNamesAndGivesTheOrderItsNumber() {
        Product burger = product(5L, "Test Burger", "8.50");
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(burger));
        Order saved = placeOrder(request(Order.DeliveryType.TAKE_AWAY, null, Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 2)), null);

        // The price of the product changes after the purchase: the line keeps the old one
        burger.setPrice(new BigDecimal("99.00"));

        assertThat(saved.getOrderNumber()).isEqualTo(Order.ORDER_NUMBER_OFFSET + 42);
        assertThat(saved.getLines()).singleElement().satisfies(line -> {
            assertThat(line.getProductName()).isEqualTo("Test Burger");
            assertThat(line.getUnitPrice()).isEqualByComparingTo("8.50");
            assertThat(line.getQuantity()).isEqualTo(2);
        });
        assertThat(saved.getSubtotal()).isEqualByComparingTo("17.00");
        assertThat(saved.getDeliveryCost()).isEqualByComparingTo("0");
        assertThat(saved.getTotal()).isEqualByComparingTo("17.00");
        assertThat(saved.isPaid()).isTrue();
        assertThat(saved.getUser()).isNull();
        assertThat(saved.getCustomerName()).isEqualTo("Ana Pérez");
    }

    @Test
    void aHomeDeliveryBelowTheThresholdPaysTheDeliveryCost() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));

        Order saved = placeOrder(request(Order.DeliveryType.DELIVERY, " Calle Mayor 1 ", Order.PaymentMethod.CASH,
                new OrderLineRequestDTO(5L, 1)), null);

        assertThat(saved.getDeliveryCost()).isEqualByComparingTo("3.00");
        assertThat(saved.getTotal()).isEqualByComparingTo("11.50");
        assertThat(saved.getDeliveryAddress()).isEqualTo("Calle Mayor 1");
        assertThat(saved.isPaid()).isFalse();
    }

    @Test
    void aHomeDeliveryFromTheThresholdIsFree() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "12.50")));

        Order saved = placeOrder(request(Order.DeliveryType.DELIVERY, "Calle Mayor 1", Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 2)), null);

        assertThat(saved.getDeliveryCost()).isEqualByComparingTo("0");
        assertThat(saved.getTotal()).isEqualByComparingTo("25.00");
    }

    @Test
    void theOrderOfACustomerIsSavedInTheirHistoryButNotTheOrderOfAnEmployee() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        OrderRequestDTO request = request(Order.DeliveryType.EAT_IN, null, Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 1));

        assertThat(placeOrder(request, new KomboUserDetails(owner)).getUser()).isSameAs(owner);
        assertThat(placeOrder(request, new KomboUserDetails(user(3L, User.Role.EMPLOYEE))).getUser()).isNull();
    }

    @Test
    void aHomeDeliveryNeedsAnAddress() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));
        OrderRequestDTO request = request(Order.DeliveryType.DELIVERY, "  ", Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 1));

        assertThatThrownBy(() -> orderService.create(request, null))
                .isInstanceOf(InvalidOrderException.class)
                .hasMessageContaining("deliveryAddress");
    }

    @Test
    void aProductThatIsNotOnTheMenuCannotBeOrdered() {
        when(productRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.empty());
        OrderRequestDTO request = request(Order.DeliveryType.TAKE_AWAY, null, Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(7L, 1));

        assertThatThrownBy(() -> orderService.create(request, null))
                .isInstanceOf(InvalidOrderException.class)
                .hasMessageContaining("Product 7");
    }

    @Test
    void aNewDeliveryAddressIsSavedInTheProfileOfTheCustomer() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        owner.addAddress("Calle Tulipán s/n");
        KomboUserDetails customer = new KomboUserDetails(owner);

        placeOrder(request(Order.DeliveryType.DELIVERY, " Calle Mayor 1 ", Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 1)), customer);
        // A saved address is not added again
        placeOrder(request(Order.DeliveryType.DELIVERY, "Calle Tulipán s/n", Order.PaymentMethod.CARD,
                new OrderLineRequestDTO(5L, 1)), customer);

        assertThat(owner.getAddresses()).containsExactly("Calle Tulipán s/n", "Calle Mayor 1");
    }

    @Test
    void theHistoryOfAUserIsReadPageByPage() {
        Pageable firstPage = PageRequest.of(0, 4);
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(orderRepository.findByUserOrderByCreatedAtDesc(owner, firstPage))
                .thenReturn(new PageImpl<>(List.of(order), firstPage, 5));

        Page<OrderDTO> history = orderService.findByUser(1L, firstPage);

        assertThat(history.getContent()).hasSize(1);
        assertThat(history.getTotalElements()).isEqualTo(5);
        assertThatThrownBy(() -> orderService.findByUser(99L, firstPage))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void anEmployeePlacesACounterOrderWithoutEmailOrPhone() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));
        OrderRequestDTO request = new OrderRequestDTO(List.of(new OrderLineRequestDTO(5L, 1)),
                Order.DeliveryType.EAT_IN, null, Order.PaymentMethod.CASH, " Mesa 4 ", "", null);

        Order saved = placeOrder(request, new KomboUserDetails(user(3L, User.Role.EMPLOYEE)));

        assertThat(saved.getCustomerName()).isEqualTo("Mesa 4");
        assertThat(saved.getCustomerEmail()).isNull();
        assertThat(saved.getCustomerPhone()).isNull();
        assertThat(saved.getUser()).isNull();
    }

    @Test
    void customersAndAnonymousUsersGiveTheirEmailAndPhone() {
        when(productRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(product(5L, "Test Burger", "8.50")));
        OrderRequestDTO withoutEmail = new OrderRequestDTO(List.of(new OrderLineRequestDTO(5L, 1)),
                Order.DeliveryType.EAT_IN, null, Order.PaymentMethod.CASH, "Ana", " ", "600123456");
        OrderRequestDTO withoutPhone = new OrderRequestDTO(List.of(new OrderLineRequestDTO(5L, 1)),
                Order.DeliveryType.EAT_IN, null, Order.PaymentMethod.CASH, "Ana", "ana@example.com", null);

        assertThatThrownBy(() -> orderService.create(withoutEmail, null)).hasMessage("customerEmail: is required");
        assertThatThrownBy(() -> orderService.create(withoutPhone, null)).hasMessage("customerPhone: is required");
    }

    // Dashboard of the employees

    @Test
    void theDashboardReadsTheOrdersOfTheStatusesOrAllOfThem() {
        Pageable firstPage = PageRequest.of(0, 10);
        List<Order.OrderStatus> pending = List.of(Order.OrderStatus.IN_PREPARATION, Order.OrderStatus.READY);
        when(orderRepository.findByStatusIn(pending, firstPage)).thenReturn(new PageImpl<>(List.of(order)));
        when(orderRepository.findAll(firstPage)).thenReturn(new PageImpl<>(List.of(order, order)));

        assertThat(orderService.findByStatus(pending, null, firstPage).getContent()).hasSize(1);
        assertThat(orderService.findByStatus(List.of(), null, firstPage).getContent()).hasSize(2);
        assertThat(orderService.findByStatus(null, null, firstPage).getContent()).hasSize(2);
    }

    @Test
    void theDashboardReadsOnlyTheOrdersPlacedFromADate() {
        Pageable firstPage = PageRequest.of(0, 10);
        LocalDateTime today = LocalDate.now().atStartOfDay();
        List<Order.OrderStatus> finished = List.of(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED);
        when(orderRepository.findByStatusInAndCreatedAtGreaterThanEqual(finished, today, firstPage))
                .thenReturn(new PageImpl<>(List.of(order)));
        when(orderRepository.findByCreatedAtGreaterThanEqual(today, firstPage))
                .thenReturn(new PageImpl<>(List.of(order, order, order)));

        assertThat(orderService.findByStatus(finished, today, firstPage).getContent()).hasSize(1);
        assertThat(orderService.findByStatus(null, today, firstPage).getContent()).hasSize(3);
    }

    @Test
    void anOrderMovesForwardUntilItIsDelivered() {
        Order cash = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(cash));

        orderService.update(12L, new OrderUpdateDTO(Order.OrderStatus.READY, null));
        assertThat(cash.getStatus()).isEqualTo(Order.OrderStatus.READY);

        orderService.update(12L, new OrderUpdateDTO(Order.OrderStatus.DELIVERED, true));
        assertThat(cash.isPaid()).isTrue();
        assertThat(cash.getStatus()).isEqualTo(Order.OrderStatus.DELIVERED);
        assertThat(cash.getDeliveredAt()).isNotNull();
    }

    @Test
    void aCashOrderIsNotDeliveredBeforeItIsPaid() {
        Order cash = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        cash.setStatus(Order.OrderStatus.READY);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(cash));
        OrderUpdateDTO deliver = new OrderUpdateDTO(Order.OrderStatus.DELIVERED, null);

        assertThatThrownBy(() -> orderService.update(12L, deliver))
                .isInstanceOf(OrderStatusException.class)
                .hasMessageContaining("must be paid");
        assertThat(cash.getStatus()).isEqualTo(Order.OrderStatus.READY);
    }

    @Test
    void anOrderCannotGoBackOrChangeOnceItIsFinished() {
        order.setStatus(Order.OrderStatus.READY);
        OrderUpdateDTO back = new OrderUpdateDTO(Order.OrderStatus.IN_PREPARATION, null);
        assertThatThrownBy(() -> orderService.update(10L, back)).isInstanceOf(OrderStatusException.class);

        orderService.update(10L, new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null));
        OrderUpdateDTO deliver = new OrderUpdateDTO(Order.OrderStatus.DELIVERED, null);
        assertThatThrownBy(() -> orderService.update(10L, deliver))
                .isInstanceOf(OrderStatusException.class)
                .hasMessageContaining("cannot change from CANCELLED to DELIVERED");
        // The same status again changes nothing
        assertThat(orderService.update(10L, new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null))).isNotNull();
    }

    @Test
    void theCashPaymentIsMarkedOnlyOnce() {
        Order cash = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(cash));

        orderService.update(12L, new OrderUpdateDTO(null, true));
        orderService.update(12L, new OrderUpdateDTO(null, true));

        assertThat(cash.isPaid()).isTrue();
        OrderUpdateDTO notPaid = new OrderUpdateDTO(null, false);
        assertThatThrownBy(() -> orderService.update(12L, notPaid)).isInstanceOf(InvalidOrderException.class);
    }

    @Test
    void aCancelledOrderCannotBePaid() {
        Order cash = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        cash.setStatus(Order.OrderStatus.CANCELLED);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(cash));
        OrderUpdateDTO paid = new OrderUpdateDTO(null, true);

        assertThatThrownBy(() -> orderService.update(12L, paid)).isInstanceOf(OrderStatusException.class);
        assertThat(cash.isPaid()).isFalse();
    }

    @Test
    void anUpdateNeedsAChangeAndAnOrderThatExists() {
        OrderUpdateDTO empty = new OrderUpdateDTO(null, null);
        OrderUpdateDTO ready = new OrderUpdateDTO(Order.OrderStatus.READY, null);

        assertThatThrownBy(() -> orderService.update(10L, empty)).isInstanceOf(InvalidOrderException.class);
        assertThatThrownBy(() -> orderService.update(99L, ready)).isInstanceOf(ResourceNotFoundException.class);
    }

    // Places the order with a delivery cost of 3.00 and returns the order that was saved (with the id 42)
    private Order placeOrder(OrderRequestDTO request, KomboUserDetails currentUser) {
        Settings settings = new Settings();
        settings.setDeliveryCost(new BigDecimal("3.00"));
        when(settingsService.findSettings()).thenReturn(settings);
        doAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            ReflectionTestUtils.setField(order, "id", 42L);
            return order;
        }).when(orderRepository).save(any());
        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);

        orderService.create(request, currentUser);

        verify(orderRepository, atLeastOnce()).save(saved.capture());
        return saved.getValue();
    }

    private static OrderRequestDTO request(Order.DeliveryType deliveryType, String address,
            Order.PaymentMethod paymentMethod, OrderLineRequestDTO... lines) {
        return new OrderRequestDTO(List.of(lines), deliveryType, address, paymentMethod, " Ana Pérez ",
                "ana@example.com", "600123456");
    }

    private static Product product(long id, String name, String price) {
        Product product = new Product(name, new BigDecimal(price), "Description", "Burgers");
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    // The id is generated by the database, so it is set by reflection in the unit tests
    private static User user(long id, User.Role role) {
        User user = new User("Name", "Surname", "user" + id + "@kombo.com", null, "hash", role);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
