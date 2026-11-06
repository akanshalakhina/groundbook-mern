'use strict';
const { testDatabase } = require('./helpers');

const db = testDatabase('bookings');
beforeAll(() => db.start());
afterAll(() => db.stop());

const body = (from, to, extra = {}) => ({ ground: 'A', event: 'league', from, to, club: 'Ambedkar Nagar CC', ...extra });

test('Saturday two till five is requested, held from 13:20 to 17:30', async () => {
  const res = await db.api().post('/bookings').send(body('2026-10-03T14:00:00Z', '2026-10-03T17:00:00Z'));

  expect(res.status).toBe(201);
  expect(res.headers.location).toBe(`/bookings/${res.body.bookingId}`);
  expect(res.body).toMatchObject({ state: 'requested', groundHeldFrom: '2026-10-03T13:20:00Z', groundHeldTo: '2026-10-03T17:30:00Z' });
});

test('a league at 06:20 is held from 05:40, before the ground opens: 400 bad-interval naming 06:00', async () => {
  const res = await db.api().post('/bookings').send(body('2026-10-03T06:20:00Z', '2026-10-03T08:00:00Z'));

  expect(res.status).toBe(400);
  expect(res.body.type).toBe('/errors/bad-interval');
  expect(res.body.opens).toBe('06:00');
});

test('five till two ends before it starts: 400 bad-interval', async () => {
  const res = await db.api().post('/bookings').send(body('2026-10-03T17:00:00Z', '2026-10-03T14:00:00Z'));

  expect(res.body.type).toBe('/errors/bad-interval');
});

test('a request without from is a 400 validation problem naming from', async () => {
  const res = await db.api().post('/bookings').send(body(undefined, '2026-10-03T17:00:00Z'));

  expect(res.status).toBe(400);
  expect(res.body.type).toBe('/errors/validation');
  expect(res.body.errors.map((e) => e.field)).toContain('from');
});
