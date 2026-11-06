'use strict';
const express = require('express');
const request = require('supertest');
const { makeBookingRouter } = require('../src/bookings/router');
const { errorHandler } = require('../src/errors/middleware');
const { Overlap } = require('../src/errors');

/** The booking router and the error middleware alone: a fake service, no createApp, no database. */
function appWith(service) {
  const app = express();
  app.use(express.json());
  app.use(makeBookingRouter(service));
  app.use(errorHandler);
  return app;
}

test('an Overlap thrown by the service becomes a 409 overlap problem with clashesWith', async () => {
  const clashesWith = [{ bookingId: 'BK0001', groundHeldFrom: '2026-10-03T13:20:00Z', groundHeldTo: '2026-10-03T16:30:00Z' }];
  const service = { request: jest.fn().mockRejectedValue(new Overlap(clashesWith)) };

  const res = await request(appWith(service)).post('/bookings').send({
    ground: 'A', event: 'league', from: '2026-10-03T16:00:00Z', to: '2026-10-03T18:00:00Z', club: 'Ambedkar Nagar CC',
  });

  expect(res.status).toBe(409);
  expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  expect(res.body.clashesWith).toEqual(clashesWith);
});
