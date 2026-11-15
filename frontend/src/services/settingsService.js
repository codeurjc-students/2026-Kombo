import { apiFetch } from './httpClient';

const SETTINGS_PATH = '/api/v1/settings';

// { deliveryCost, freeDeliveryThreshold }
export function getSettings() {
  return apiFetch(SETTINGS_PATH);
}

// Only the administrator
export function updateDeliveryCost(deliveryCost) {
  return apiFetch(SETTINGS_PATH, { method: 'PUT', body: { deliveryCost } });
}
