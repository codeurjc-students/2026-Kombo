package es.urjc.kombo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.SettingsDTO;
import es.urjc.kombo.dto.SettingsUpdateDTO;
import es.urjc.kombo.service.SettingsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    // Public: the cart shows the delivery cost to every user
    @GetMapping
    public SettingsDTO getSettings() {
        return settingsService.getSettings();
    }

    // Only the administrator (rule in SecurityConfig)
    @PutMapping
    public SettingsDTO updateSettings(@Valid @RequestBody SettingsUpdateDTO update) {
        return settingsService.update(update);
    }
}
