'use strict';
const { refusal, problem, ok, pathParam } = require('../docs');

const venue = pathParam('venue', 'The venue slug, e.g. deccan');
const noSuchVenue = (p) => refusal('No such venue', problem(404, '/errors/no-such-venue', 'No such venue', 'There is no venue mumbai', p));

const paths = {
  '/venues/{venue}/grounds': {
    get: {
      tags: ['grounds'],
      summary: 'The four grounds and their opening hours, weekdays and Sundays',
      parameters: [venue],
      responses: {
        200: ok('The grounds', {
          venue: 'deccan',
          grounds: [{ ground: 'A', name: 'Ground A', opens: '06:00', closes: '22:00', sundayOpens: '07:00', sundayCloses: '20:00' }],
        }),
        404: noSuchVenue('/venues/mumbai/grounds'),
      },
    },
  },
  '/venues/{venue}/event-types': {
    get: {
      tags: ['grounds'],
      summary: 'The event types and their setup and teardown minutes',
      parameters: [venue],
      responses: {
        200: ok('The event types', { eventTypes: [{ code: 'league', name: 'League match', setupMinutes: 40, teardownMinutes: 30 }] }),
        404: noSuchVenue('/venues/mumbai/event-types'),
      },
    },
  },
  '/venues/{venue}/grounds/{ground}/day': {
    get: {
      tags: ['grounds'],
      summary: "One ground's day: its hours and its bookings, each with the setup and teardown around it",
      parameters: [venue, pathParam('ground', 'The ground code, A to D'),
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD (default today)' }],
      responses: {
        200: ok('The day', {
          venue: 'deccan', ground: 'A', date: '2026-10-03', opens: '06:00', closes: '22:00',
          bookings: [{
            bookingId: 'BK0412', event: 'league', from: '2026-10-03T14:00:00Z', to: '2026-10-03T17:00:00Z',
            groundHeldFrom: '2026-10-03T13:20:00Z', groundHeldTo: '2026-10-03T17:30:00Z', state: 'confirmed',
          }],
        }),
        400: refusal('The date is not a calendar day', problem(400, '/errors/validation', 'Invalid request',
          'The request is not valid', '/venues/deccan/grounds/A/day', { errors: [{ field: 'date', message: 'must be a real calendar day' }] })),
        404: refusal('The venue or the ground does not exist',
          problem(404, '/errors/no-such-ground', 'No such ground', 'This venue has no ground Z', '/venues/deccan/grounds/Z/day'),
          problem(404, '/errors/no-such-venue', 'No such venue', 'There is no venue mumbai', '/venues/mumbai/grounds/A/day')),
      },
    },
  },
};

module.exports = { paths };
