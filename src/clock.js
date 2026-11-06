'use strict';

/** The real clock. Everything else asks the clock it was given, so a test can pass one it controls. */
const systemClock = {
  now: () => new Date(),
};

module.exports = { systemClock };
