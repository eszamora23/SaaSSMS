/**
 * Calendar Utilities
 * Generate calendar links and .ics files for appointments
 */

/**
 * Format date for calendar URLs (YYYYMMDDTHHMMSSZ)
 */
const formatCalendarDate = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (appointment) => {
  const { startTime, endTime, serviceId, customerId, notes } = appointment;

  const title = encodeURIComponent(
    `${serviceId?.name || 'Appointment'} - ${customerId?.name || 'Customer'}`
  );
  const description = encodeURIComponent(
    notes || `Appointment for ${serviceId?.name || 'service'}`
  );
  const location = encodeURIComponent(serviceId?.location || '');

  const start = formatCalendarDate(startTime);
  const end = formatCalendarDate(endTime);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
};

/**
 * Generate Outlook Calendar URL
 */
export const generateOutlookCalendarUrl = (appointment) => {
  const { startTime, endTime, serviceId, customerId, notes } = appointment;

  const title = encodeURIComponent(
    `${serviceId?.name || 'Appointment'} - ${customerId?.name || 'Customer'}`
  );
  const description = encodeURIComponent(
    notes || `Appointment for ${serviceId?.name || 'service'}`
  );
  const location = encodeURIComponent(serviceId?.location || '');

  const start = new Date(startTime).toISOString();
  const end = new Date(endTime).toISOString();

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${description}&location=${location}`;
};

/**
 * Generate Office 365 Calendar URL
 */
export const generateOffice365CalendarUrl = (appointment) => {
  const { startTime, endTime, serviceId, customerId, notes } = appointment;

  const title = encodeURIComponent(
    `${serviceId?.name || 'Appointment'} - ${customerId?.name || 'Customer'}`
  );
  const description = encodeURIComponent(
    notes || `Appointment for ${serviceId?.name || 'service'}`
  );
  const location = encodeURIComponent(serviceId?.location || '');

  const start = new Date(startTime).toISOString();
  const end = new Date(endTime).toISOString();

  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${description}&location=${location}`;
};

/**
 * Generate Yahoo Calendar URL
 */
export const generateYahooCalendarUrl = (appointment) => {
  const { startTime, endTime, serviceId, customerId, notes } = appointment;

  const title = encodeURIComponent(
    `${serviceId?.name || 'Appointment'} - ${customerId?.name || 'Customer'}`
  );
  const description = encodeURIComponent(
    notes || `Appointment for ${serviceId?.name || 'service'}`
  );
  const location = encodeURIComponent(serviceId?.location || '');

  const start = formatCalendarDate(startTime);
  const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000); // duration in minutes

  return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${start}&dur=${duration}&desc=${description}&in_loc=${location}`;
};

/**
 * Generate .ics file content (iCalendar format)
 */
export const generateIcsFile = (appointment) => {
  const { startTime, endTime, serviceId, customerId, notes, _id } = appointment;

  const title = `${serviceId?.name || 'Appointment'} - ${customerId?.name || 'Customer'}`;
  const description = notes || `Appointment for ${serviceId?.name || 'service'}`;
  const location = serviceId?.location || '';

  const start = formatCalendarDate(startTime);
  const end = formatCalendarDate(endTime);
  const timestamp = formatCalendarDate(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SaaS SMS Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appointment-${_id}@saas-sms-calendar.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return icsContent;
};

/**
 * Download .ics file
 */
export const downloadIcsFile = (appointment) => {
  const icsContent = generateIcsFile(appointment);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${appointment._id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open calendar URL in new window
 */
export const openCalendarUrl = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
