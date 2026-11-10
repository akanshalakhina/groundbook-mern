'use strict';
const grounds = require('./grounds/docs');
const bookings = require('./bookings/docs');
const moves = require('./moves/docs');
const { ok, refusal, problem } = require('./docs');

const health = {
  '/healthz': {
    get: {
      tags: ['health'],
      summary: 'Up, and the database answers',
      responses: {
        200: ok('The app and its database are up', { status: 'ok' }),
        503: refusal('The database cannot be reached',
          problem(503, '/errors/unavailable', 'Unavailable', 'The database cannot be reached', '/healthz')),
      },
    },
  },
};

/** The OpenAPI 3 document, put together from each feature's own description. */
const document = {
  openapi: '3.0.3',
  info: { title: 'GroundBook', version: '1.0.0', description: 'Booking the grounds of one sports complex, setup and teardown included.' },
  tags: [
    { name: 'grounds', description: 'The grounds, their hours, the event types and a day' },
    { name: 'bookings', description: 'Requests, confirmations and cancellations' },
    { name: 'moves', description: 'Moving a booking' },
    { name: 'health', description: 'Whether the app is up' },
  ],
  paths: { ...grounds.paths, ...bookings.paths, ...moves.paths, ...health },
};

module.exports = { document };
