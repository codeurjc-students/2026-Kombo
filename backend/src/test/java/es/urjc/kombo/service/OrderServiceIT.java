package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderLineRequestDTO;
import es.urjc.kombo.dto.OrderRequestDTO;
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

    private OrderRequestDTO request(Order.DeliveryType deliveryType, int quantity) {
        return new OrderRequestDTO(List.of(new OrderLineRequestDTO(burger.getId(), quantity)), deliveryType,
                "Calle Tulipán s/n", Order.PaymentMethod.CARD, "Ana", "ana@example.com", "600123456");
    }
}
