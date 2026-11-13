/**
 * Date formatting helpers respecting local timezones without UTC skew
 */

export function toLocalDatetimeInputValue(date = new Date()) {
  const d = new Date(date);
  const offsetMs = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function parseLocalDatetimeInput(value) {
  if (!value) return null;
  // new Date("YYYY-MM-DDTHH:mm") is parsed in local timezone by ECMAScript spec
  return new Date(value);
}
