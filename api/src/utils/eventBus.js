/**
 * Event Bus
 * Simple event emitter for internal application events
 */

const EventEmitter = require('events');
const logger = require('./logger');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Increase max listeners for multiple subscriptions

    // Log all events in debug mode
    if (process.env.NODE_ENV === 'development') {
      this.onAny((event, data) => {
        logger.debug('Event emitted', { event, data });
      });
    }
  }

  /**
   * Listen to all events
   */
  onAny(handler) {
    const events = [
      'message.sent',
      'message.received',
      'message.status_updated',
      'appointment.created',
      'appointment.rescheduled',
      'appointment.canceled',
      'appointment.confirmed',
      'appointment.completed',
      'appointment.no_show',
      'customer.created',
      'customer.updated',
      'thread.assigned',
      'webhook.delivered',
      'webhook.failed',
    ];

    events.forEach((event) => {
      this.on(event, (data) => handler(event, data));
    });
  }
}

const eventBus = new AppEventBus();

module.exports = eventBus;
