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

module.exports = { connect, disconnect };
