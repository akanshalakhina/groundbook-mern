'use strict';
const express = require('express');
const { z } = require('zod');
const { parse } = require('../validate');

/** A real calendar day written YYYY-MM-DD (2026-13-40 is not one). */
const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d),
    'must be a real calendar day');

const dayQuery = z.object({
  date: calendarDay.optional(),
});

function makeGroundRouter(service) {
  const router = express.Router();

  router.get('/venues/:venue/grounds', async (req, res) => {
    res.json(await service.grounds(req.params.venue));
  });

  router.get('/venues/:venue/event-types', async (req, res) => {
    res.json(await service.eventTypes(req.params.venue));
  });

  router.get('/settings', async (req, res) => {
    res.json(await service.currentSettings());
  });

  router.get('/venues/:venue/grounds/:ground/day', async (req, res) => {
    const { date } = parse(dayQuery, req.query);
    res.json(await service.day(req.params.venue, req.params.ground, date));
  });

  return router;
}

module.exports = { makeGroundRouter };
