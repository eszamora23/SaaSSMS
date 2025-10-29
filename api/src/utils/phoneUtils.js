/**
 * Phone Number Utilities
 * Formatting, validation, parsing
 */

const validator = require('validator');

/**
 * Validate E.164 format (+15551234567)
 */
const isValidE164 = (phone) => {
  return validator.isMobilePhone(phone, 'any', { strictMode: true });
};

/**
 * Format phone number to E.164
 * Attempts to parse various formats and convert to E.164
 */
const formatToE164 = (phone, countryCode = '+1') => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If doesn't start with country code, add it
  if (!phone.startsWith('+')) {
    // Remove leading 1 if present (for US/Canada)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    // Add country code
    cleaned = countryCode.replace('+', '') + cleaned;
  }

  // Add + prefix
  const formatted = '+' + cleaned;

  // Validate
  if (!isValidE164(formatted)) {
    throw new Error('Invalid phone number format');
  }

  return formatted;
};

/**
 * Format phone number for display
 * E.164 -> (555) 123-4567
 */
const formatForDisplay = (phone) => {
  // Assume US format for now
  const cleaned = phone.replace(/\D/g, '');

  // Extract parts (assuming US: +1 XXX XXX XXXX)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const areaCode = cleaned.substring(1, 4);
    const prefix = cleaned.substring(4, 7);
    const lineNumber = cleaned.substring(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  } else if (cleaned.length === 10) {
    const areaCode = cleaned.substring(0, 3);
    const prefix = cleaned.substring(3, 6);
    const lineNumber = cleaned.substring(6, 10);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  // Return as-is if can't format
  return phone;
};

/**
 * Parse phone number components
 */
const parsePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return {
      countryCode: '1',
      areaCode: cleaned.substring(1, 4),
      prefix: cleaned.substring(4, 7),
      lineNumber: cleaned.substring(7, 11),
      full: phone,
    };
  }

  return null;
};

module.exports = {
  isValidE164,
  formatToE164,
  formatForDisplay,
  parsePhone,
};
