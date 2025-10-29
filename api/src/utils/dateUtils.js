/**
 * Date and Time Utilities
 */

const { DateTime } = require('luxon');

/**
 * Convert date to organization's timezone
 */
const toOrgTimezone = (date, timezone = 'America/New_York') => {
  return DateTime.fromJSDate(date).setZone(timezone);
};

/**
 * Parse ISO date string to DateTime
 */
const parseISODate = (dateString, timezone = 'UTC') => {
  return DateTime.fromISO(dateString, { zone: timezone });
};

/**
 * Get start and end of day in timezone
 */
const getDayBounds = (date, timezone) => {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  return {
    start: dt.startOf('day').toJSDate(),
    end: dt.endOf('day').toJSDate(),
  };
};

/**
 * Get start and end of week
 */
const getWeekBounds = (date, timezone) => {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  return {
    start: dt.startOf('week').toJSDate(),
    end: dt.endOf('week').toJSDate(),
  };
};

/**
 * Get start and end of month
 */
const getMonthBounds = (date, timezone) => {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  return {
    start: dt.startOf('month').toJSDate(),
    end: dt.endOf('month').toJSDate(),
  };
};

/**
 * Add minutes to date
 */
const addMinutes = (date, minutes) => {
  return DateTime.fromJSDate(date).plus({ minutes }).toJSDate();
};

/**
 * Add hours to date
 */
const addHours = (date, hours) => {
  return DateTime.fromJSDate(date).plus({ hours }).toJSDate();
};

/**
 * Add days to date
 */
const addDays = (date, days) => {
  return DateTime.fromJSDate(date).plus({ days }).toJSDate();
};

/**
 * Check if date is in the past
 */
const isPast = (date) => {
  return DateTime.fromJSDate(date) < DateTime.now();
};

/**
 * Check if date is in the future
 */
const isFuture = (date) => {
  return DateTime.fromJSDate(date) > DateTime.now();
};

/**
 * Format date for display
 */
const formatForDisplay = (date, timezone, format = 'MMM dd, yyyy h:mm a') => {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
};

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
const getDayOfWeek = (date) => {
  return DateTime.fromJSDate(date).weekday % 7; // Luxon uses 1-7 (Mon-Sun), convert to 0-6 (Sun-Sat)
};

/**
 * Check if two date ranges overlap
 */
const doRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

/**
 * Calculate duration in minutes between two dates
 */
const getDurationMinutes = (startDate, endDate) => {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  return end.diff(start, 'minutes').minutes;
};

module.exports = {
  toOrgTimezone,
  parseISODate,
  getDayBounds,
  getWeekBounds,
  getMonthBounds,
  addMinutes,
  addHours,
  addDays,
  isPast,
  isFuture,
  formatForDisplay,
  getDayOfWeek,
  doRangesOverlap,
  getDurationMinutes,
};
