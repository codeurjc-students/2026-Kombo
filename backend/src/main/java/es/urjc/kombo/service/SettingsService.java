package es.urjc.kombo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.SettingsDTO;
import es.urjc.kombo.dto.SettingsUpdateDTO;
import es.urjc.kombo.model.Settings;
import es.urjc.kombo.repository.SettingsRepository;

@Service
@Transactional
public class SettingsService {

    private final SettingsRepository settingsRepository;

    public SettingsService(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    public SettingsDTO getSettings() {
        return toDTO(findSettings());
    }

    public SettingsDTO update(SettingsUpdateDTO update) {
        Settings settings = findSettings();
        settings.setDeliveryCost(update.deliveryCost());
        settings.setCancellationFeePercent(update.cancellationFeePercent());
        return toDTO(settings);
    }

    // The row is created with the default values the first time it is needed
    Settings findSettings() {
        return settingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> settingsRepository.save(new Settings()));
    }

    private static SettingsDTO toDTO(Settings settings) {
        return new SettingsDTO(settings.getDeliveryCost(), Settings.FREE_DELIVERY_THRESHOLD,
                settings.getCancellationFeePercent());
    }
}
