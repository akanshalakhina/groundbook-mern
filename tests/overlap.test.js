'use strict';
const { testDatabase } = require('./helpers');

const db = testDatabase('overlap');
beforeAll(() => db.start());
afterAll(() => db.stop());

const league = (ground, from, to) => db.api().post('/bookings').send({
  ground, event: 'league', from: `2026-10-03T${from}:00Z`, to: `2026-10-03T${to}:00Z`, club: 'Ambedkar Nagar CC',
});

test('four o\'clock back to back clashes once the buffers are counted, naming the first booking', async () => {
  const first = (await league('A', '14:00', '16:00')).body.bookingId;

  const res = await league('A', '16:00', '18:00');

  expect(res.status).toBe(409);
  expect(res.body.type).toBe('/errors/overlap');
  expect(res.body.clashesWith.map((c) => c.bookingId)).toEqual([first]);
});

test('a request held from exactly where the other shadow ends is fine', async () => {
  await league('B', '14:00', '16:00');

  const res = await league('B', '17:10', '19:00');

  expect(res.status).toBe(201);
});

test('a cancelled booking cannot be confirmed again', async () => {
  const id = (await league('C', '14:00', '16:00')).body.bookingId;
  await db.api().post(`/bookings/${id}/cancel`);

  const res = await db.api().post(`/bookings/${id}/confirm`);

  expect(res.status).toBe(409);
  expect(res.body.type).toBe('/errors/cancelled');
});
