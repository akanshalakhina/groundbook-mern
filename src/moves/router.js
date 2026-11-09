'use strict';
const express = require('express');
const { z } = require('zod');
const { parse } = require('../validate');

const moveBody = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
});

function makeMoveRouter(service) {
  const router = express.Router();

  router.post('/bookings/:bookingId/move', async (req, res) => {
    res.json(await service.move(req.params.bookingId, parse(moveBody, req.body)));
  });

  return router;
}

module.exports = { makeMoveRouter };
