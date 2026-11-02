package es.urjc.kombo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity 
@Table(name = "orders")
public class Order {
    
    public enum DeliveryType { EAT_IN, TAKE_AWAY, DELIVERY }
    public enum OrderStatus { IN_PREPARATION, READY, DELIVERED, CANCELLED }
    public enum PaymentMethod { CARD, CASH }


    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderLine> lines =  new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private DeliveryType deliveryType;

    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.IN_PREPARATION;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private boolean paid;

    private String customerName;     // checkout form data
    private String customerEmail;
    private String customerPhone;

    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;

    private BigDecimal deliveryCost = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;

    protected Order() {
    }

    public Order(User user, DeliveryType deliveryType, PaymentMethod paymentMethod) {
        this.user = user;
        this.deliveryType = deliveryType;
        this.paymentMethod = paymentMethod;
        this.createdAt = LocalDateTime.now();
    }

    public void addLine(Product product, int quantity) {
        lines.add(new OrderLine(product, quantity));
        recalculateTotal();
    }

    public void setDeliveryCost(BigDecimal deliveryCost) {
        this.deliveryCost = deliveryCost;
        recalculateTotal();
    }

    private void recalculateTotal() {
        total = lines.stream()
                .map(OrderLine::getSubtotal)
                .reduce(deliveryCost, BigDecimal::add);
    }
    
    //getters
        public Long getId() {
        return id;
    }

    public Integer getOrderNumber() {
        return orderNumber;
    }

    public User getUser() {
        return user;
    }

    public List<OrderLine> getLines() {
        return Collections.unmodifiableList(lines);
    }

    public DeliveryType getDeliveryType() {
        return deliveryType;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public boolean isPaid() {
        return paid;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public BigDecimal getDeliveryCost() {
        return deliveryCost;
    }

    public BigDecimal getTotal() {
        return total;
    }

    //setters
        public void setOrderNumber(Integer orderNumber) {
        this.orderNumber = orderNumber;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
}
