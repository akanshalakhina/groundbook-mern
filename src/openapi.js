'use strict';
const grounds = require('./grounds/docs');
const bookings = require('./bookings/docs');
const moves = require('./moves/docs');

/** The OpenAPI 3 document, put together from each feature's own description. */
const document = {
  openapi: '3.0.3',
  info: { title: 'GroundBook', version: '1.0.0', description: 'Booking the grounds of one sports complex, setup and teardown included.' },
  tags: [
    { name: 'grounds', description: 'The grounds, their hours, the event types and a day' },
    { name: 'bookings', description: 'Requests, confirmations and cancellations' },
    { name: 'moves', description: 'Moving a booking' },
  ],
  paths: { ...grounds.paths, ...bookings.paths, ...moves.paths },
};

module.exports = { document };
