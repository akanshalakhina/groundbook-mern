'use strict';
const mongoose = require('mongoose');

/**
 * Connect to MongoDB and sync indexes, or disconnect.
 * server.js calls connect(uri) at start-up, and disconnect() when shutting down.
 */
async function connect(uri) {
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function disconnect() {
  await mongoose.disconnect();
}

/**
 * Runs work(session) in one MongoDB transaction: every read and write inside must be given the session. If any of
 * them fails, nothing of it is kept.
 */
async function inTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { connect, disconnect, inTransaction };
