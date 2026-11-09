'use strict';
const { refusal, problem, ok, pathParam } = require('../docs');
const { noSuchBooking, overlap, alreadyStarted, cancelled } = require('../bookings/docs');

const where = '/bookings/BK0412/move';

const paths = {
  '/bookings/{bookingId}/move': {
    post: {
      tags: ['moves'],
      summary: 'Move a booking: the whole new interval and both buffers are checked again, in one transaction',
      parameters: [pathParam('bookingId', 'The booking id, e.g. BK0412')],
      requestBody: {
        required: true,
        content: { 'application/json': { example: { from: '2026-10-03T15:00:00Z', to: '2026-10-03T18:00:00Z' } } },
      },
      responses: {
        200: ok('Moved', {
          bookingId: 'BK0412', from: '2026-10-03T15:00:00Z', to: '2026-10-03T18:00:00Z', groundHeldFrom: '2026-10-03T14:20:00Z',
          groundHeldTo: '2026-10-03T18:30:00Z', movedAt: '2026-10-01T10:00:00Z',
        }),
        400: refusal('The body fails validation, or the new interval is impossible',
          problem(400, '/errors/bad-interval', 'Bad interval', 'The interval must end after it starts', where),
          problem(400, '/errors/validation', 'Invalid request', 'The request is not valid', where, { errors: [{ field: 'to', message: 'Required' }] })),
        404: noSuchBooking('/bookings/BK9999/move'),
        409: refusal('The new shadow clashes, the booking has begun, or it is cancelled',
          overlap(where), alreadyStarted(where), cancelled(where)),
      },
    },
  },
};

module.exports = { paths };
