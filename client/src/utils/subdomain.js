/**
 * Subdomain Utility Functions
 * Handles subdomain detection and organization slug extraction
 */

/**
 * Extract subdomain from current hostname
 * @returns {string|null} - Subdomain or null if on main domain
 */
export const getSubdomain = () => {
  const hostname = window.location.hostname;

  // Main localhost/127.0.0.1 (no subdomain)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // lvh.me pattern: subdomain.lvh.me
  if (hostname.includes('lvh.me')) {
    const parts = hostname.split('.');
    if (parts.length === 3 && parts[0] !== 'lvh') {
      return parts[0]; // Return subdomain
    }
    return null; // No subdomain (just lvh.me)
  }

  // *.localhost pattern: test.localhost
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0]; // Return subdomain (e.g., "test" from "test.localhost")
    }
    return null;
  }

  // Production pattern: subdomain.yourdomain.com
  const parts = hostname.split('.');

  // No subdomain if less than 3 parts (e.g., yourdomain.com)
  if (parts.length < 3) {
    return null;
  }

  // Check if it's www (not a tenant subdomain)
  if (parts[0] === 'www') {
    return null;
  }

  // Return first part as subdomain
  return parts[0];
};

/**
 * Check if current request is on a subdomain
 * @returns {boolean}
 */
export const isOnSubdomain = () => {
  return getSubdomain() !== null;
};

/**
 * Get organization slug from subdomain
 * @returns {string|null}
 */
export const getOrgSlugFromSubdomain = () => {
  return getSubdomain();
};

/**
 * Build URL for a specific subdomain
 * @param {string} subdomain - The subdomain/org slug
 * @param {string} path - Optional path (default: '/')
 * @returns {string} - Full URL
 */
export const buildSubdomainUrl = (subdomain, path = '/') => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  let baseDomain = hostname;

  // Handle localhost patterns
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    baseDomain = 'localhost';
  } else if (hostname.endsWith('.localhost')) {
    baseDomain = 'localhost';
  } else if (hostname.includes('lvh.me')) {
    baseDomain = 'lvh.me';
  } else {
    // Extract base domain (remove subdomain if present)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      baseDomain = parts.slice(-2).join('.');
    }
  }

  const portPart = port ? `:${port}` : '';
  return `${protocol}//${subdomain}.${baseDomain}${portPart}${path}`;
};

/**
 * Get main domain URL (no subdomain)
 * @param {string} path - Optional path (default: '/')
 * @returns {string} - Full URL
 */
export const getMainDomainUrl = (path = '/') => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  let baseDomain = hostname;

  // If on lvh.me subdomain, return lvh.me
  if (hostname.includes('lvh.me')) {
    baseDomain = 'lvh.me';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    baseDomain = 'localhost';
  } else {
    // Extract base domain (remove subdomain if present)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      baseDomain = parts.slice(-2).join('.');
    }
  }

  const portPart = port ? `:${port}` : '';
  return `${protocol}//${baseDomain}${portPart}${path}`;
};
