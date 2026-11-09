'use strict';
const { refusal, problem, ok, pathParam } = require('../docs');

const bookingId = pathParam('bookingId', 'The booking id, e.g. BK0412');
const noSuchBooking = (p) => refusal('No such booking', problem(404, '/errors/no-such-booking', 'No such booking', 'There is no booking BK9999', p));
const clashesWith = [{ bookingId: 'BK0411', groundHeldFrom: '2026-10-03T13:20:00Z', groundHeldTo: '2026-10-03T16:30:00Z' }];
const overlap = (p) => problem(409, '/errors/overlap', 'Overlap', 'With setup and teardown counted, the ground is already held then', p,
  { clashesWith });
const alreadyStarted = (p) => problem(409, '/errors/already-started', 'Already started',
  'The interval has begun; it can no longer be confirmed or moved', p);
const cancelled = (p) => problem(409, '/errors/cancelled', 'Cancelled',
  'A cancelled booking cannot be confirmed or moved; request a new one', p);
const held = {
  bookingId: 'BK0412', ground: 'A', event: 'league', from: '2026-10-03T14:00:00Z', to: '2026-10-03T17:00:00Z',
  groundHeldFrom: '2026-10-03T13:20:00Z', groundHeldTo: '2026-10-03T17:30:00Z',
};

const paths = {
  '/bookings': {
    post: {
      tags: ['bookings'],
      summary: 'A club asks for a slot: a requested booking, held for a while, with its setup and teardown',
      requestBody: {
        required: true,
        content: { 'application/json': { example: { ground: 'A', event: 'league', from: held.from, to: held.to, club: 'Ambedkar Nagar CC' } } },
      },
      responses: {
        201: ok('Requested', { ...held, state: 'requested', holdUntil: '2026-10-02T08:00:00Z' }),
        400: refusal('The body fails validation, the interval is impossible, or the event type is unknown',
          problem(400, '/errors/validation', 'Invalid request', 'The request is not valid', '/bookings',
            { errors: [{ field: 'from', message: 'Required' }] }),
          problem(400, '/errors/bad-interval', 'Bad interval',
            'With setup and teardown, the ground is held outside its hours, 06:00-22:00', '/bookings', { opens: '06:00', closes: '22:00' }),
          problem(400, '/errors/no-such-event-type', 'No such event type', 'There is no event type concert', '/bookings')),
        404: refusal('No such ground', problem(404, '/errors/no-such-ground', 'No such ground', 'This venue has no ground Z', '/bookings')),
        409: refusal('The shadow clashes with another booking', overlap('/bookings')),
      },
    },
  },
  '/bookings/{bookingId}': {
    get: {
      tags: ['bookings'],
      summary: 'One booking, its shadow and its whole history',
      parameters: [bookingId],
      responses: {
        200: ok('The booking', { ...held, state: 'requested', events: [{ at: '2026-10-01T08:00:00Z', kind: 'requested', from: held.from, to: held.to }] }),
        404: noSuchBooking('/bookings/BK9999'),
      },
    },
  },
  '/bookings/{bookingId}/confirm': {
    post: {
      tags: ['bookings'],
      summary: 'Confirm a requested booking, before it begins and while nothing clashes',
      parameters: [bookingId],
      responses: {
        200: ok('Confirmed', { bookingId: 'BK0412', state: 'confirmed', confirmedAt: '2026-10-01T09:00:00Z' }),
        404: noSuchBooking('/bookings/BK9999/confirm'),
        409: refusal('Begun, cancelled, already confirmed, or clashing',
          alreadyStarted('/bookings/BK0412/confirm'), cancelled('/bookings/BK0412/confirm'),
          problem(409, '/errors/already-confirmed', 'Already confirmed', 'The booking is already confirmed', '/bookings/BK0412/confirm'),
          overlap('/bookings/BK0412/confirm')),
      },
    },
  },
  '/bookings/{bookingId}/cancel': {
    post: {
      tags: ['bookings'],
      summary: 'Cancel a booking before it ends; once it has begun the cancel is late',
      parameters: [bookingId],
      responses: {
        200: ok('Cancelled', { bookingId: 'BK0412', state: 'cancelled', cancelledAt: '2026-10-03T14:20:00Z', late: true }),
        404: noSuchBooking('/bookings/BK9999/cancel'),
        409: refusal('Over, or already cancelled',
          problem(409, '/errors/already-over', 'Already over', 'The interval has ended; it can no longer be cancelled', '/bookings/BK0412/cancel'),
          problem(409, '/errors/already-cancelled', 'Already cancelled', 'The booking is already cancelled', '/bookings/BK0412/cancel')),
      },
    },
  },
};

module.exports = { paths, noSuchBooking, overlap, alreadyStarted, cancelled };
