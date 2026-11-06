'use strict';
const { NoSuchVenue, NoSuchGround } = require('../errors');
const { hoursOn } = require('./hours');
const { shape } = require('../bookings/service');

/** A ground as the API shows it: its code as `ground`, its name and its hours. */
function shapeGround(g) {
  return {
    ground: g.code, name: g.name, opens: g.opens, closes: g.closes, sundayOpens: g.sundayOpens, sundayCloses: g.sundayCloses,
  };
}

/** A booking as the day lists it, with its shadow; the ground is the day's own, so it is not repeated. */
function dayLine(b, type) {
  const { bookingId, event, from, to, groundHeldFrom, groundHeldTo, state } = shape(b, type);
  return { bookingId, event, from, to, groundHeldFrom, groundHeldTo, state };
}

function makeGroundService({ repository, bookings, clock }) {
  async function requireVenue(venue) {
    if (!(await repository.venueExists(venue))) throw new NoSuchVenue(venue);
  }

  /** The venue's grounds, A to D, each with its weekday and Sunday hours. */
  async function grounds(venue) {
    await requireVenue(venue);
    return { venue, grounds: (await repository.groundsOf(venue)).map(shapeGround) };
  }

  /** The event types with their setup and teardown buffers. */
  async function eventTypes(venue) {
    await requireVenue(venue);
    const types = await repository.eventTypesOf(venue);
    return {
      eventTypes: types.map((t) => ({
        code: t.code, name: t.name, setupMinutes: t.setupMinutes, teardownMinutes: t.teardownMinutes,
      })),
    };
  }

  /**
   * One ground's day: its hours on that weekday, and its bookings in `from` order, each with the shadow its event type
   * gives it now (the buffers are read on every request). No date means today by the clock, in UTC.
   */
  async function day(venue, code, date) {
    await requireVenue(venue);
    const g = await repository.ground(venue, code);
    if (!g) throw new NoSuchGround(code);
    const on = date || clock.now().toISOString().slice(0, 10);
    const types = new Map((await repository.eventTypesOf(venue)).map((t) => [t.code, t]));
    const list = (await bookings.onDay(venue, code, on)).map((b) => dayLine(b, types.get(b.eventTypeId)));
    return { venue, ground: code, date: on, ...hoursOn(g, on), bookings: list };
  }

  return { grounds, eventTypes, day };
}

module.exports = { makeGroundService };
