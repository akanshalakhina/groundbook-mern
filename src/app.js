'use strict';
const express = require('express');
const { inTransaction } = require('./db');
const groundRepository = require('./grounds/repository');
const { makeGroundService } = require('./grounds/service');
const { makeGroundRouter } = require('./grounds/router');
const bookingRepository = require('./bookings/repository');
const { makeBookingService } = require('./bookings/service');
const { makeBookingRouter } = require('./bookings/router');
const { makeMoveService } = require('./moves/service');
const { makeMoveRouter } = require('./moves/router');
const { notFound, errorHandler } = require('./errors/middleware');

/** Builds the Express app. It never connects to the database and never listens: server.js and tests do that. */
function createApp({ settings, clock }) {
  const app = express();
  const grounds = makeGroundService({ repository: groundRepository, bookings: bookingRepository, clock });
  const bookings = makeBookingService({ bookings: bookingRepository, grounds: groundRepository, settings, clock });
  const moves = makeMoveService({ bookings: bookingRepository, grounds: groundRepository, clock, inTransaction });

  app.use(express.json());
  app.use(makeGroundRouter(grounds));
  app.use(makeBookingRouter(bookings));
  app.use(makeMoveRouter(moves));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
