import { apiFetch } from './httpClient';

const SETTINGS_PATH = '/api/v1/settings';

// { deliveryCost, freeDeliveryThreshold, cancellationFeePercent }
export function getSettings() {
  return apiFetch(SETTINGS_PATH);
}

// Only the administrator: { deliveryCost, cancellationFeePercent }
export function updateSettings(settings) {
  return apiFetch(SETTINGS_PATH, { method: 'PUT', body: settings });
}
