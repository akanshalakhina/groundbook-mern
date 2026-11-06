'use strict';
const {
  NoSuchGround, NoSuchEventType, NoSuchBooking, BadInterval, ValidationError, AlreadyStarted, Cancelled, AlreadyConfirmed,
  AlreadyOver, AlreadyCancelled, Overlap,
} = require('../errors');
const { hoursOn } = require('../grounds/hours');
const { wholeSecond, iso } = require('../time');

const VENUE = 'deccan';
const MINUTE = 60 * 1000;

/** The ground is held from the setup before the event to the teardown after it. Derived on every read, never stored. */
function shadowOf(fromAt, toAt, type) {
  return {
    heldFrom: new Date(fromAt.getTime() - type.setupMinutes * MINUTE),
    heldTo: new Date(toAt.getTime() + type.teardownMinutes * MINUTE),
  };
}

/** Two shadows clash when each starts before the other ends (half-open: touching shadows do not clash). */
function clash(a, b) {
  return a.heldFrom < b.heldTo && b.heldFrom < a.heldTo;
}

/**
 * Refuses a booking whose shadow clashes with a live booking's on the same ground and date (leaving itself out),
 * naming each clashing booking and the range it holds. The buffers are read from the event types now.
 */
async function refuseClashes({ bookings, grounds }, { bookingId, groundId, fromAt, toAt, type }, now) {
  const mine = shadowOf(fromAt, toAt, type);
  const types = new Map((await grounds.eventTypesOf(VENUE)).map((t) => [t.code, t]));
  const others = await bookings.liveOnDay(VENUE, groundId, iso(fromAt).slice(0, 10), now, bookingId);
  const clashing = others.map((o) => ({ o, held: shadowOf(o.fromAt, o.toAt, types.get(o.eventTypeId)) }))
    .filter(({ held }) => clash(mine, held));
  if (clashing.length) {
    throw new Overlap(clashing.map(({ o, held }) => ({
      bookingId: o.bookingId, groundHeldFrom: iso(held.heldFrom), groundHeldTo: iso(held.heldTo),
    })));
  }
}

/** A booking as the API shows it, with its shadow; the club's name stays inside. */
function shape(b, type) {
  const { heldFrom, heldTo } = shadowOf(b.fromAt, b.toAt, type);
  return {
    bookingId: b.bookingId, ground: b.groundId, event: b.eventTypeId, from: iso(b.fromAt), to: iso(b.toAt),
    groundHeldFrom: iso(heldFrom), groundHeldTo: iso(heldTo), state: b.state,
  };
}

/** The instant a ground's "HH:MM" falls at on a date. */
function at(date, hhmm) {
  return new Date(`${date}T${hhmm}:00Z`);
}

/**
 * The rules of an interval, after the body is valid: to after from, 30 minutes to 12 hours (a validation problem),
 * not in the past, one date, and the shadow inside the ground's hours that weekday.
 */
function checkInterval({ ground, type, now }, fromAt, toAt) {
  if (toAt <= fromAt) throw new BadInterval('The interval must end after it starts');
  const minutes = (toAt - fromAt) / MINUTE;
  if (minutes < 30 || minutes > 12 * 60) {
    throw new ValidationError([{ field: 'to', message: 'An interval lasts from 30 minutes to 12 hours' }]);
  }
  if (fromAt < now) throw new BadInterval('Nobody books the past');
  const date = iso(fromAt).slice(0, 10);
  if (iso(toAt).slice(0, 10) !== date) throw new BadInterval('The interval must start and end on the same date');
  const hours = hoursOn(ground, date);
  const { heldFrom, heldTo } = shadowOf(fromAt, toAt, type);
  if (heldFrom < at(date, hours.opens) || heldTo > at(date, hours.closes)) {
    throw new BadInterval(`With setup and teardown, the ground is held outside its hours, ${hours.opens}-${hours.closes}`, hours);
  }
}

async function requireBooking(bookings, id) {
  const found = await bookings.byId(VENUE, id);
  if (!found) throw new NoSuchBooking(id);
  return found;
}

/**
 * A requested booking is confirmed - only before its interval begins (by the clock, read now), and only if its shadow
 * still clashes with nothing live (a competing request may have been confirmed since).
 */
async function confirmBooking({ bookings, grounds, clock }, id) {
  const b = await requireBooking(bookings, id);
  if (b.state === 'cancelled') throw new Cancelled();
  if (b.state === 'confirmed') throw new AlreadyConfirmed();
  const confirmedAt = wholeSecond(clock.now());
  if (confirmedAt >= b.fromAt) throw new AlreadyStarted();
  const type = await grounds.eventType(VENUE, b.eventTypeId);
  await refuseClashes({ bookings, grounds }, { bookingId: id, groundId: b.groundId, fromAt: b.fromAt, toAt: b.toAt, type }, confirmedAt);
  await bookings.stamp(id, { state: 'confirmed', confirmedAt });
  return { bookingId: id, state: 'confirmed', confirmedAt: iso(confirmedAt) };
}

/**
 * A requested or confirmed booking is cancelled - only before its interval ends. Once it has begun the cancel is late:
 * allowed and flagged, and the day keeps the block rather than giving the hour back.
 */
async function cancelBooking({ bookings, clock }, id) {
  const b = await requireBooking(bookings, id);
  if (b.state === 'cancelled') throw new AlreadyCancelled();
  const cancelledAt = wholeSecond(clock.now());
  if (cancelledAt >= b.toAt) throw new AlreadyOver();
  const late = cancelledAt >= b.fromAt;
  await bookings.stamp(id, { state: 'cancelled', cancelledAt, lateCancel: late });
  return { bookingId: id, state: 'cancelled', cancelledAt: iso(cancelledAt), late };
}

function makeBookingService({ bookings, grounds, settings, clock }) {
  /** A club asks for a slot: a requested booking, held for HOLD_HOURS from now, unless its shadow clashes. */
  async function request({ ground: code, event, from, to, club }) {
    const ground = await grounds.ground(VENUE, code);
    if (!ground) throw new NoSuchGround(code);
    const type = await grounds.eventType(VENUE, event);
    if (!type) throw new NoSuchEventType(event);
    const fromAt = wholeSecond(new Date(from));
    const toAt = wholeSecond(new Date(to));
    const requestedAt = wholeSecond(clock.now());
    checkInterval({ ground, type, now: requestedAt }, fromAt, toAt);
    await refuseClashes({ bookings, grounds }, { bookingId: null, groundId: code, fromAt, toAt, type }, requestedAt);
    const holdUntil = new Date(requestedAt.getTime() + settings.holdHours * 60 * MINUTE);
    const requested = {
      bookingId: await bookings.nextId(VENUE), venueId: VENUE, groundId: code, eventTypeId: event, clubName: club, fromAt, toAt,
      state: 'requested', requestedAt, holdUntil,
    };
    await bookings.insert(requested);
    return { ...shape(requested, type), holdUntil: iso(holdUntil) };
  }

  async function booking(id) {
    const found = await requireBooking(bookings, id);
    return shape(found, await grounds.eventType(VENUE, found.eventTypeId));
  }

  return {
    request,
    booking,
    confirm: (id) => confirmBooking({ bookings, grounds, clock }, id),
    cancel: (id) => cancelBooking({ bookings, clock }, id),
  };
}

module.exports = { makeBookingService, shadowOf, shape };
