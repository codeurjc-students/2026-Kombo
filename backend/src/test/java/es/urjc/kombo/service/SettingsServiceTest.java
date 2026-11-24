package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import es.urjc.kombo.dto.SettingsDTO;
import es.urjc.kombo.dto.SettingsUpdateDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.Settings;
import es.urjc.kombo.repository.SettingsRepository;

// Delivery cost settings and the rule that uses them, with the repository mocked
class SettingsServiceTest {

    private final SettingsRepository settingsRepository = mock(SettingsRepository.class);
    private final SettingsService settingsService = new SettingsService(settingsRepository);

    @Test
    void theSettingsAreCreatedWithTheDefaultValuesTheFirstTime() {
        when(settingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(settingsRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SettingsDTO settings = settingsService.getSettings();

        assertThat(settings.deliveryCost()).isEqualByComparingTo("2.50");
        assertThat(settings.freeDeliveryThreshold()).isEqualByComparingTo("25.00");
        assertThat(settings.cancellationFeePercent()).isEqualTo(80);
    }

    @Test
    void theAdministratorChangesTheDeliveryCost() {
        Settings stored = new Settings();
        when(settingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(stored));

        SettingsDTO settings = settingsService.update(new SettingsUpdateDTO(new BigDecimal("3.20"), 50));

        assertThat(settings.deliveryCost()).isEqualByComparingTo("3.20");
        assertThat(stored.getDeliveryCost()).isEqualByComparingTo("3.20");
        assertThat(settings.cancellationFeePercent()).isEqualTo(50);
        assertThat(stored.getCancellationFeePercent()).isEqualTo(50);
    }

    @Test
    void theCancellationFeeIsAPercentageOfTheTotalRoundedToCents() {
        Settings settings = new Settings();
        assertThat(settings.getCancellationFeePercent()).isEqualTo(80);
        assertThat(settings.cancellationFeeFor(new BigDecimal("10.00"))).isEqualByComparingTo("8.00");

        settings.setCancellationFeePercent(33);
        assertThat(settings.cancellationFeeFor(new BigDecimal("10.05"))).isEqualByComparingTo("3.32");
        settings.setCancellationFeePercent(0);
        assertThat(settings.cancellationFeeFor(new BigDecimal("10.05"))).isEqualByComparingTo("0");
    }

    @Test
    void aDatabaseWithoutTheCancellationPercentageUsesTheDefaultOne() {
        Settings settings = new Settings();
        ReflectionTestUtils.setField(settings, "cancellationFeePercent", null);

        assertThat(settings.getCancellationFeePercent()).isEqualTo(Settings.DEFAULT_CANCELLATION_FEE_PERCENT);
    }

    @Test
    void onlyHomeDeliveriesBelowTheThresholdPayTheDeliveryCost() {
        Settings settings = new Settings();

        assertThat(settings.deliveryCostFor(Order.DeliveryType.DELIVERY, new BigDecimal("24.99")))
                .isEqualByComparingTo("2.50");
        assertThat(settings.deliveryCostFor(Order.DeliveryType.DELIVERY, new BigDecimal("25.00")))
                .isEqualByComparingTo("0");
        assertThat(settings.deliveryCostFor(Order.DeliveryType.TAKE_AWAY, BigDecimal.ONE)).isEqualByComparingTo("0");
        assertThat(settings.deliveryCostFor(Order.DeliveryType.EAT_IN, BigDecimal.ONE)).isEqualByComparingTo("0");
    }
}
