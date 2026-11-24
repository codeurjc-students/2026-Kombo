import { describe, expect, it } from 'vitest';
import { formatMinutes, formatTime, minutesSince, normalizeForSearch } from './format';

describe('format', () => {
  const now = new Date('2026-11-21T12:00:00');

  it('counts the whole minutes since a date', () => {
    expect(minutesSince('2026-11-21T11:59:40', now)).toBe(0);
    expect(minutesSince('2026-11-21T11:48:00', now)).toBe(12);
    expect(minutesSince('2026-11-21T12:05:00', now)).toBe(0);
  });

  it('writes the minutes in words', () => {
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(12)).toBe('12 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(65)).toBe('1 h 5 min');
  });

  it('writes the time of a date', () => {
    expect(formatTime('2026-11-21T09:05:00')).toBe('9:05');
  });

  it('removes the accents and the upper case of a text to search it', () => {
    expect(normalizeForSearch(' Jamón SERRANO ')).toBe('jamon serrano');
    expect(normalizeForSearch('Pingüino')).toBe('pinguino');
  });
});
