package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderLineRequestDTO;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.dto.OrderUpdateDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.OrderLine;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.KomboUserDetails;

// Real service and MySQL database (Testcontainers), without sample data
@SpringBootTest(properties = "kombo.sample-data.enabled=false")
@Import(TestcontainersConfiguration.class)
class OrderServiceIT {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private Product burger;

    @BeforeEach
    void setUp() {
        burger = productRepository.save(new Product("Order Test Burger", new BigDecimal("9.00"), "Test", "Burgers"));
    }

    @Test
    @Transactional
    void createStoresTheOrderWithItsLinesAndAUniqueNumber() {
        OrderDTO first = orderService.create(request(Order.DeliveryType.DELIVERY, 2), null);
        OrderDTO second = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);

        // The price changes after the purchase: the stored line keeps the price and name it was sold with
        burger.setPrice(new BigDecimal("15.00"));
        burger.setName("Renamed Burger");
        productRepository.flush();

        Order stored = orderRepository.findById(first.id()).orElseThrow();
        assertThat(stored.getOrderNumber()).isEqualTo(Order.ORDER_NUMBER_OFFSET + Math.toIntExact(first.id()));
        assertThat(second.orderNumber()).isNotEqualTo(first.orderNumber());
        assertThat(stored.getLines()).singleElement().satisfies((OrderLine line) -> {
            assertThat(line.getProductName()).isEqualTo("Order Test Burger");
            assertThat(line.getUnitPrice()).isEqualByComparingTo("9.00");
            assertThat(line.getProduct().getId()).isEqualTo(burger.getId());
        });
        // 18.00 is below the free delivery threshold: the default delivery cost (2.50) is added
        assertThat(stored.getDeliveryCost()).isEqualByComparingTo("2.50");
        assertThat(stored.getTotal()).isEqualByComparingTo("20.50");
        assertThat(stored.getDeliveryAddress()).isEqualTo("Calle Tulipán s/n");
        assertThat(stored.getCreatedAt()).isNotNull();
    }

    @Test
    @Transactional
    void aCustomerFindsTheirOrdersNewestFirstAndKeepsTheNewAddress() {
        User customer = userRepository.save(new User("Ana", null, "history-test@example.com", null, "hash",
                User.Role.CUSTOMER));
        KomboUserDetails session = new KomboUserDetails(customer);
        OrderDTO first = orderService.create(request(Order.DeliveryType.DELIVERY, 1), session);
        OrderDTO second = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), session);
        // Another user's order is not in the history
        orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        // Both orders are created almost at the same time in the test: the first one is made a day older
        ReflectionTestUtils.setField(orderRepository.findById(first.id()).orElseThrow(), "createdAt",
                LocalDateTime.now().minusDays(1));
        orderRepository.flush();

        Page<OrderDTO> page = orderService.findByUser(customer.getId(), PageRequest.of(0, 1));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).extracting(OrderDTO::id).containsExactly(second.id());
        assertThat(userRepository.findById(customer.getId()).orElseThrow().getAddresses())
                .containsExactly("Calle Tulipán s/n");
    }

    @Test
    @Transactional
    void theDashboardFindsTheOrdersOfTheStatusesOldestFirst() {
        OrderDTO older = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        OrderDTO newer = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        OrderDTO finished = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        ReflectionTestUtils.setField(orderRepository.findById(older.id()).orElseThrow(), "createdAt",
                LocalDateTime.now().minusHours(1));
        orderService.update(finished.id(), new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null));
        orderRepository.flush();

        Page<OrderDTO> pending = orderService.findByStatus(
                List.of(Order.OrderStatus.IN_PREPARATION, Order.OrderStatus.READY), null,
                PageRequest.of(0, 50, Sort.by("createdAt")));

        List<Long> ids = pending.getContent().stream().map(OrderDTO::id).toList();
        assertThat(ids).contains(older.id(), newer.id()).doesNotContain(finished.id());
        assertThat(ids.indexOf(older.id())).isLessThan(ids.indexOf(newer.id()));
    }

    @Test
    @Transactional
    void theDashboardFindsOnlyTheFinishedOrdersOfToday() {
        OrderDTO yesterday = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        OrderDTO today = orderService.create(request(Order.DeliveryType.TAKE_AWAY, 1), null);
        orderService.update(yesterday.id(), new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null));
        orderService.update(today.id(), new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null));
        ReflectionTestUtils.setField(orderRepository.findById(yesterday.id()).orElseThrow(), "createdAt",
                LocalDate.now().atStartOfDay().minusMinutes(1));
        orderRepository.flush();

        Page<OrderDTO> finished = orderService.findByStatus(List.of(Order.OrderStatus.CANCELLED),
                LocalDate.now().atStartOfDay(), PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertThat(finished.getContent()).extracting(OrderDTO::id).contains(today.id()).doesNotContain(yesterday.id());
    }

    @Test
    @Transactional
    void theChangesOfAnOrderAreStoredInTheDatabase() {
        OrderRequestDTO cashOrder = new OrderRequestDTO(List.of(new OrderLineRequestDTO(burger.getId(), 1)),
                Order.DeliveryType.EAT_IN, null, Order.PaymentMethod.CASH, "Ana", "ana@example.com", "600123456");
        OrderDTO placed = orderService.create(cashOrder, null);

        orderService.update(placed.id(), new OrderUpdateDTO(Order.OrderStatus.READY, true));
        orderService.update(placed.id(), new OrderUpdateDTO(Order.OrderStatus.DELIVERED, null));
        orderRepository.flush();

        Order stored = orderRepository.findById(placed.id()).orElseThrow();
        assertThat(stored.isPaid()).isTrue();
        assertThat(stored.getStatus()).isEqualTo(Order.OrderStatus.DELIVERED);
        assertThat(stored.getDeliveredAt()).isNotNull();
    }

    @Test
    @Transactional
    void aCustomerCancelsAReadyOrderAndTheFeeIsStored() {
        User customer = userRepository.save(new User("Ana", null, "cancel-test@example.com", null, "hash",
                User.Role.CUSTOMER));
        KomboUserDetails session = new KomboUserDetails(customer);
        // 2 x 9.00 + 2.50 of delivery = 20.50, paid by card; the default fee is 80% (16.40)
        OrderDTO placed = orderService.create(request(Order.DeliveryType.DELIVERY, 2), session);
        orderService.update(placed.id(), new OrderUpdateDTO(Order.OrderStatus.READY, null));

        OrderDTO cancelled = orderService.cancelByCustomer(placed.id(),
                new OrderUpdateDTO(Order.OrderStatus.CANCELLED, null), session);
        orderRepository.flush();

        Order stored = orderRepository.findById(placed.id()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
        assertThat(stored.getCancellationFee()).isEqualByComparingTo("16.40");
        assertThat(cancelled.cancellationFee()).isEqualByComparingTo("16.40");
    }

    private OrderRequestDTO request(Order.DeliveryType deliveryType, int quantity) {
        return new OrderRequestDTO(List.of(new OrderLineRequestDTO(burger.getId(), quantity)), deliveryType,
                "Calle Tulipán s/n", Order.PaymentMethod.CARD, "Ana", "ana@example.com", "600123456");
    }
}
