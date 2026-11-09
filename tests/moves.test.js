'use strict';
const { testDatabase } = require('./helpers');
const bookingRepository = require('../src/bookings/repository');

const db = testDatabase('moves');
beforeAll(() => db.start());
afterAll(() => db.stop());

const sat = (hhmm) => `2026-10-03T${hhmm}:00Z`;

async function book(ground, event, from, to) {
  const res = await db.api().post('/bookings').send({ ground, event, from: sat(from), to: sat(to), club: 'Ambedkar Nagar CC' });
  return res.body.bookingId;
}

test('Saturday moves an hour later', async () => {
  const id = await book('A', 'league', '14:00', '17:00');

  const res = await db.api().post(`/bookings/${id}/move`).send({ from: sat('15:00'), to: sat('18:00') });

  expect(res.status).toBe(200);
  expect(res.body.groundHeldFrom).toBe(sat('14:20'));
});

test('three hours later runs into the school sports day: 409 overlap, still at ten', async () => {
  const id = await book('B', 'league', '10:00', '12:00');
  await book('B', 'school_day', '18:00', '19:00');

  const res = await db.api().post(`/bookings/${id}/move`).send({ from: sat('13:00'), to: sat('16:00') });

  expect(res.status).toBe(409);
  expect(res.body.type).toBe('/errors/overlap');
  expect((await db.api().get(`/bookings/${id}`)).body.from).toBe(sat('10:00'));
});

test('when the update fails, the move is a 500 and the booking stays at two', async () => {
  const id = await book('C', 'league', '14:00', '17:00');
  jest.spyOn(bookingRepository, 'stamp').mockRejectedValueOnce(new Error('the update failed'));

  const res = await db.api().post(`/bookings/${id}/move`).send({ from: sat('15:00'), to: sat('18:00') });

  expect(res.status).toBe(500);
  expect((await db.api().get(`/bookings/${id}`)).body.from).toBe(sat('14:00'));
});
