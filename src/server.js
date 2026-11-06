'use strict';
const { loadSettings } = require('./settings');
const { systemClock } = require('./clock');
const { connect } = require('./db');
const { seed } = require('./seed');
const { createApp } = require('./app');

/** Connect, seed, then listen - so no request can arrive before the grounds exist. */
async function main() {
  const settings = loadSettings();
  await connect(settings.mongodbUri);
  await seed({ settings, clock: systemClock });
  createApp({ settings, clock: systemClock }).listen(settings.port, settings.host, () => {
    console.log(`GroundBook listening on ${settings.host}:${settings.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
