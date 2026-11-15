package es.urjc.kombo.model;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

// Settings of the restaurant that the administrator can change. There is only one row.
@Entity
public class Settings {

    // Delivery cost used until the administrator changes it
    public static final BigDecimal DEFAULT_DELIVERY_COST = new BigDecimal("2.50");

    // Orders delivered at home with a subtotal of at least this amount do not pay the delivery cost
    public static final BigDecimal FREE_DELIVERY_THRESHOLD = new BigDecimal("25.00");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal deliveryCost = DEFAULT_DELIVERY_COST;

    public Settings() {
    }

    // Delivery cost of an order: only home deliveries pay it, and only below the free delivery threshold
    public BigDecimal deliveryCostFor(Order.DeliveryType deliveryType, BigDecimal subtotal) {
        if (deliveryType != Order.DeliveryType.DELIVERY || subtotal.compareTo(FREE_DELIVERY_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        return deliveryCost;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getDeliveryCost() {
        return deliveryCost;
    }

    public void setDeliveryCost(BigDecimal deliveryCost) {
        this.deliveryCost = deliveryCost;
    }
}
