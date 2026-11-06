'use strict';
const express = require('express');
const { z } = require('zod');
const { parse } = require('../validate');

const requestBody = z.object({
  ground: z.string().min(1),
  event: z.string().min(1),
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  club: z.string().min(1),
});

function makeBookingRouter(service) {
  const router = express.Router();

  router.post('/bookings', async (req, res) => {
    const booking = await service.request(parse(requestBody, req.body));
    res.status(201).location(`/bookings/${booking.bookingId}`).json(booking);
  });

  router.get('/bookings/:bookingId', async (req, res) => {
    res.json(await service.booking(req.params.bookingId));
  });

  router.post('/bookings/:bookingId/confirm', async (req, res) => {
    res.json(await service.confirm(req.params.bookingId));
  });

  router.post('/bookings/:bookingId/cancel', async (req, res) => {
    res.json(await service.cancel(req.params.bookingId));
  });

  return router;
}

module.exports = { makeBookingRouter };
