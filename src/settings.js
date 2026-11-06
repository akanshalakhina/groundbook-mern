'use strict';
const path = require('path');

/**
 * The app's settings, read from the environment. This is the only file that reads process.env;
 * server.js calls loadSettings() once at start-up.
 */
function loadSettings() {
  const env = process.env;
  return Object.freeze({
    mongodbUri: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/groundbook',
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT || 8080),
    seedDir: env.SEED_DIR || path.join(__dirname, '..', 'seed'),
    holdHours: Number(env.HOLD_HOURS || 24),
  });
}

module.exports = { loadSettings };
