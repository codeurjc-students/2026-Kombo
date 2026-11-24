package es.urjc.kombo.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

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

    // Part of the total that the restaurant keeps when a customer cancels a paid order that is already ready
    public static final int DEFAULT_CANCELLATION_FEE_PERCENT = 80;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal deliveryCost = DEFAULT_DELIVERY_COST;

    // An Integer (not an int), so the column added to an existing database accepts null instead of being 0: the
    // getter then gives the default value
    private Integer cancellationFeePercent = DEFAULT_CANCELLATION_FEE_PERCENT;

    public Settings() {
    }

    // Delivery cost of an order: only home deliveries pay it, and only below the free delivery threshold
    public BigDecimal deliveryCostFor(Order.DeliveryType deliveryType, BigDecimal subtotal) {
        if (deliveryType != Order.DeliveryType.DELIVERY || subtotal.compareTo(FREE_DELIVERY_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        return deliveryCost;
    }

    // Money that the restaurant keeps from the total of an order, rounded to cents
    public BigDecimal cancellationFeeFor(BigDecimal total) {
        return total.multiply(BigDecimal.valueOf(getCancellationFeePercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
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

    public int getCancellationFeePercent() {
        return cancellationFeePercent == null ? DEFAULT_CANCELLATION_FEE_PERCENT : cancellationFeePercent;
    }

    public void setCancellationFeePercent(int cancellationFeePercent) {
        this.cancellationFeePercent = cancellationFeePercent;
    }
}
