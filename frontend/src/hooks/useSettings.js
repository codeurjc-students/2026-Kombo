import { useEffect, useState } from 'react';
import { getSettings } from '../services/settingsService';

// Delivery cost settings of the restaurant: { settings, error }. settings is null while it loads.
export default function useSettings() {
  const [state, setState] = useState({ settings: null, error: null });

  useEffect(() => {
    let active = true;
    getSettings()
      .then((settings) => active && setState({ settings, error: null }))
      .catch((error) => active && setState({ settings: null, error }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
