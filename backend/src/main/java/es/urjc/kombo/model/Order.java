package es.urjc.kombo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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

    public static final int ORDER_NUMBER_OFFSET = 1000;


    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    // Number shown to the customer: ORDER_NUMBER_OFFSET + id, so it is unique (see assignOrderNumber)
    @Column(unique = true)
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

    // Money of a cancelled order that the restaurant keeps (null while the order is not cancelled). The rest of a
    // paid order is given back to the customer.
    private BigDecimal cancellationFee;

    protected Order() {
    }

    public Order(User user, DeliveryType deliveryType, PaymentMethod paymentMethod) {
        this.user = user;
        this.deliveryType = deliveryType;
        this.paymentMethod = paymentMethod;
        this.createdAt = LocalDateTime.now(ZoneId.systemDefault());
    }

    public void addLine(Product product, int quantity) {
        lines.add(new OrderLine(product, quantity));
        recalculateTotal();
    }

    public void setDeliveryCost(BigDecimal deliveryCost) {
        this.deliveryCost = deliveryCost;
        recalculateTotal();
    }

    // Gives the order its number from its id, which the database has just generated (call it after saving)
    public void assignOrderNumber() {
        if (id == null) {
            throw new IllegalStateException("The order must be saved before it gets its number");
        }
        this.orderNumber = ORDER_NUMBER_OFFSET + Math.toIntExact(id);
    }

    // Sum of the lines, without the delivery cost
    public BigDecimal getSubtotal() {
        return lines.stream()
                .map(OrderLine::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void recalculateTotal() {
        total = getSubtotal().add(deliveryCost);
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

    public BigDecimal getCancellationFee() {
        return cancellationFee;
    }

    //setters
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

    public void setCancellationFee(BigDecimal cancellationFee) {
        this.cancellationFee = cancellationFee;
    }
    
}
