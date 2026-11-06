'use strict';
const { testDatabase } = require('./helpers');

const db = testDatabase('transitions');
beforeAll(() => db.start());
afterAll(() => db.stop());

/** Saturday two till five on this ground, requested on Thursday morning; its booking id. */
async function saturdayLeague(ground) {
  const res = await db.api().post('/bookings').send({
    ground, event: 'league', from: '2026-10-03T14:00:00Z', to: '2026-10-03T17:00:00Z', club: 'Ambedkar Nagar CC',
  });
  return res.body.bookingId;
}

test('a requested booking is confirmed on Thursday', async () => {
  const id = await saturdayLeague('A');

  const res = await db.api().post(`/bookings/${id}/confirm`);

  expect(res.status).toBe(200);
  expect(res.body.state).toBe('confirmed');
});

test('confirming at 14:20 on Saturday is too late: 409 already-started', async () => {
  const id = await saturdayLeague('B');

  const res = await db.api('2026-10-03T14:20:00Z').post(`/bookings/${id}/confirm`);

  expect(res.status).toBe(409);
  expect(res.body.type).toBe('/errors/already-started');
});

test('cancelling twenty minutes in is a late cancel', async () => {
  const id = await saturdayLeague('C');

  const res = await db.api('2026-10-03T14:20:00Z').post(`/bookings/${id}/cancel`);

  expect(res.status).toBe(200);
  expect(res.body.late).toBe(true);
});

test('cancelling at 17:30 is too late: 409 already-over', async () => {
  const id = await saturdayLeague('D');

  const res = await db.api('2026-10-03T17:30:00Z').post(`/bookings/${id}/cancel`);

  expect(res.status).toBe(409);
  expect(res.body.type).toBe('/errors/already-over');
});
