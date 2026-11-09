'use strict';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { testDatabase } = require('./helpers');

const db = testDatabase('rules');
beforeAll(() => db.start());
afterAll(() => db.stop());
beforeEach(() => db.reset());

/**
 * The rule table, one row per case: case, tag, setup steps, action, then the status and type with every event type at
 * 40/30 and with each type's own buffers. Read when the file loads, because test.each needs its rows then.
 */
const rows = fs.readFileSync(path.join(__dirname, 'rules.csv'), 'utf8').split(/\r?\n/).slice(1)
  .filter((line) => line.trim()).map((line) => line.split(','));

const sat = (hhmm) => `2026-10-03T${hhmm}:00Z`;

/** One step of a row: "request A league 14:00 17:00", "clock 14:20", "confirm", "cancel" or "move 15:00 18:00". */
async function step(text, last) {
  const [verb, a, b, c, d] = text.trim().split(' ');
  const api = () => db.api(last.at);
  if (verb === 'clock') {
    last.at = sat(a);
    return null;
  }
  if (verb === 'request') {
    const res = await api().post('/bookings').send({ ground: a, event: b, from: sat(c), to: sat(d), club: 'Ambedkar Nagar CC' });
    last.booking = last.booking || res.body.bookingId;
    return res;
  }
  if (verb === 'move') return api().post(`/bookings/${last.booking}/move`).send({ from: sat(a), to: sat(b) });
  return api().post(`/bookings/${last.booking}/${verb}`);
}

/** Runs a row's setup and action on a fresh planner: the action's status and problem type. */
async function outcome(setup, action) {
  const last = {};
  for (const text of setup.split(';').filter(Boolean)) await step(text, last);
  const res = await step(action, last);
  return { status: res.status, type: res.status >= 400 ? res.body.type : '' };
}

/** Every event type at 40/30: written into the eventTypes documents, which the app reads on every request. */
function uniformBuffers() {
  return mongoose.connection.db.collection('eventTypes').updateMany({}, { $set: { setupMinutes: 40, teardownMinutes: 30 } });
}

test.each(rows)('%s (%s) with every type at 40/30', async (name, tag, setup, action, status, type) => {
  await uniformBuffers();
  expect(await outcome(setup, action)).toEqual({ status: Number(status), type });
});

test.each(rows)('%s (%s) with each type\'s own buffers', async (name, tag, setup, action, s, t, status, type) => {
  expect(await outcome(setup, action)).toEqual({ status: Number(status), type });
});

test('GET /settings shows the hold and the live buffers', async () => {
  const res = await db.api().get('/settings');

  expect(res.body.holdHours).toBe(24);
  expect(res.body.buffers.practice).toEqual([20, 20]);
});
