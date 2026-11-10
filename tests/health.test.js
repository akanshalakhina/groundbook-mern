'use strict';
const db = require('../src/db');
const { testDatabase } = require('./helpers');

const testDb = testDatabase('health');
beforeAll(() => testDb.start());
afterAll(() => testDb.stop());

test('health is ok while the database answers', async () => {
  const res = await testDb.api().get('/healthz');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});

test('health is a 503 when the database does not answer', async () => {
  jest.spyOn(db, 'ping').mockRejectedValueOnce(new Error('no database'));

  const res = await testDb.api().get('/healthz');

  expect(res.status).toBe(503);
  expect(res.body.type).toBe('/errors/unavailable');
});
