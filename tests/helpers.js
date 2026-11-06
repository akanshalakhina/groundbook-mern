'use strict';
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { connect, disconnect } = require('../src/db');
const { seed } = require('../src/seed');
const { createApp } = require('../src/app');
const { loadSettings } = require('../src/settings');

/** A fixed clock: every test runs at the same moment (Thursday morning, when Rafi rings about Saturday). */
const clock = { now: () => new Date('2026-10-01T08:00:00Z') };

/** An in-memory MongoDB for one test file: start() connects and seeds; api() is Supertest on a fresh app. */
function testDatabase(name) {
  let mongo;
  const settings = loadSettings();
  return {
    settings,
    async start() {
      mongo = await MongoMemoryServer.create();
      await connect(mongo.getUri(name));
      await seed({ settings, clock });
    },
    /** Supertest on a fresh app; given a time, its clock stands at that time instead. */
    api: (at) => request(createApp({ settings, clock: at ? { now: () => new Date(at) } : clock })),
    async stop() {
      await disconnect();
      await mongo.stop();
    },
  };
}

module.exports = { clock, testDatabase };
