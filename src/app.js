'use strict';
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { inTransaction } = require('./db');
const { document } = require('./openapi');
const groundRepository = require('./grounds/repository');
const { makeGroundService } = require('./grounds/service');
const { makeGroundRouter } = require('./grounds/router');
const bookingRepository = require('./bookings/repository');
const eventRepository = require('./events/repository');
const { makeBookingService } = require('./bookings/service');
const { makeBookingRouter } = require('./bookings/router');
const { makeMoveService } = require('./moves/service');
const { makeMoveRouter } = require('./moves/router');
const { makeLastRoute, errorHandler } = require('./errors/middleware');

/** Builds the Express app. It never connects to the database and never listens: server.js and tests do that. */
function createApp({ settings, clock }) {
  const app = express();
  const grounds = makeGroundService({ repository: groundRepository, bookings: bookingRepository, settings, clock });
  const bookings = makeBookingService({
    bookings: bookingRepository, grounds: groundRepository, events: eventRepository, settings, clock, inTransaction,
  });
  const moves = makeMoveService({
    bookings: bookingRepository, grounds: groundRepository, events: eventRepository, clock, inTransaction,
  });

  app.use(express.json());
  app.get('/openapi.json', (req, res) => res.json(document));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
  app.use(makeGroundRouter(grounds));
  app.use(makeBookingRouter(bookings));
  app.use(makeMoveRouter(moves));
  app.use(makeLastRoute(document.paths));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
