'use strict';
const mongoose = require('mongoose');
require('../src/events/repository');
const { testDatabase } = require('./helpers');

const db = testDatabase('events');
beforeAll(() => db.start());
afterAll(() => db.stop());

test('a booking requested, confirmed and moved shows those three events, in order', async () => {
  const id = (await db.api().post('/bookings').send({
    ground: 'A', event: 'league', from: '2026-10-03T14:00:00Z', to: '2026-10-03T17:00:00Z', club: 'Ambedkar Nagar CC',
  })).body.bookingId;
  await db.api().post(`/bookings/${id}/confirm`);
  await db.api().post(`/bookings/${id}/move`).send({ from: '2026-10-03T15:00:00Z', to: '2026-10-03T18:00:00Z' });

  const res = await db.api().get(`/bookings/${id}`);

  expect(res.body.events.map((e) => e.kind)).toEqual(['requested', 'confirmed', 'moved']);
  expect(res.body.events[2]).toMatchObject({ previousFrom: '2026-10-03T14:00:00Z', from: '2026-10-03T15:00:00Z' });
});

test('an event cannot be changed or deleted', async () => {
  const Event = mongoose.model('Event');

  await expect(Event.updateOne({}, { $set: { kind: 'cancelled' } })).rejects.toThrow('append-only');
  await expect(Event.deleteMany({})).rejects.toThrow('append-only');
  expect(await Event.countDocuments()).toBeGreaterThan(0);
});
