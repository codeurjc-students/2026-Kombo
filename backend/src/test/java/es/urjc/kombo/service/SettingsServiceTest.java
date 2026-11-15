package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;

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
    }

    @Test
    void theAdministratorChangesTheDeliveryCost() {
        Settings stored = new Settings();
        when(settingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(stored));

        SettingsDTO settings = settingsService.update(new SettingsUpdateDTO(new BigDecimal("3.20")));

        assertThat(settings.deliveryCost()).isEqualByComparingTo("3.20");
        assertThat(stored.getDeliveryCost()).isEqualByComparingTo("3.20");
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
