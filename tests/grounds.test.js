'use strict';
const { seed } = require('../src/seed');
const { clock, testDatabase } = require('./helpers');

const db = testDatabase('grounds');
beforeAll(() => db.start());
afterAll(() => db.stop());

test('starting twice still gives four grounds', async () => {
  await seed({ settings: db.settings, clock });
  await seed({ settings: db.settings, clock });

  const res = await db.api().get('/venues/deccan/grounds');

  expect(res.status).toBe(200);
  expect(res.body.grounds.map((g) => g.ground)).toEqual(['A', 'B', 'C', 'D']);
});

test('a Sunday runs 07:00 to 20:00', async () => {
  const res = await db.api().get('/venues/deccan/grounds/A/day?date=2026-10-04');

  expect(res.body.opens).toBe('07:00');
  expect(res.body.closes).toBe('20:00');
});

test('a league match is set up for 40 minutes and torn down for 30', async () => {
  const res = await db.api().get('/venues/deccan/event-types');

  expect(res.body.eventTypes.find((t) => t.code === 'league')).toMatchObject({ setupMinutes: 40, teardownMinutes: 30 });
});

test('a date that is not a calendar day is a 400 validation problem', async () => {
  const res = await db.api().get('/venues/deccan/grounds/A/day?date=2026-13-40');

  expect(res.status).toBe(400);
  expect(res.body.type).toBe('/errors/validation');
});

test('ground Z is a 404 no-such-ground problem', async () => {
  const res = await db.api().get('/venues/deccan/grounds/Z/day');

  expect(res.status).toBe(404);
  expect(res.body.type).toBe('/errors/no-such-ground');
});
