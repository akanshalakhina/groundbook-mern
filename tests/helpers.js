'use strict';
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect } = require('../src/db');
const { seed } = require('../src/seed');
const { createApp } = require('../src/app');
const { loadSettings } = require('../src/settings');

/** A fixed clock: every test runs at the same moment (Thursday morning, when Rafi rings about Saturday). */
const clock = { now: () => new Date('2026-10-01T08:00:00Z') };

/**
 * An in-memory MongoDB for one test file. Transactions need a replica set, so it is a one-member replica set.
 * start() connects and seeds; api() is Supertest on a fresh app; stop() closes everything.
 */
function testDatabase(name) {
  let mongo;
  const settings = loadSettings();
  return {
    settings,
    async start() {
      mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await connect(mongo.getUri(name));
      await seed({ settings, clock });
    },
    /** Supertest on a fresh app; given a time, its clock stands at that time instead. */
    api: (at) => request(createApp({ settings, clock: at ? { now: () => new Date(at) } : clock })),
    /** Empties every collection and seeds again: a fresh planner, same database. */
    async reset() {
      const collections = await mongoose.connection.db.collections();
      await Promise.all(collections.map((c) => c.deleteMany({})));
      await seed({ settings, clock });
    },
    async stop() {
      await disconnect();
      await mongo.stop();
    },
  };
}

module.exports = { clock, testDatabase };
