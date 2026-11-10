'use strict';
const { AlreadyStarted, Cancelled } = require('../errors');
const { shadowOf, checkInterval, refuseClashes, requireBooking, eventOf } = require('../bookings/service');
const { wholeSecond, iso } = require('../time');
const log = require('../log');

const VENUE = 'deccan';

function makeMoveService({ bookings, grounds, events, clock, inTransaction }) {
  /**
   * A booking moves to a new interval: the same checks as a request, the clash check leaving the booking itself out,
   * the old interval released and the new one taken in one update, and the moved event written - all inside one
   * transaction, so a failure leaves the booking exactly where it was. The state is kept.
   */
  async function move(id, { from, to }) {
    const moved = await inTransaction(async (session) => {
      const b = await requireBooking(bookings, id, session);
      if (b.state === 'cancelled') throw new Cancelled();
      const movedAt = wholeSecond(clock.now());
      if (movedAt >= b.fromAt) throw new AlreadyStarted();
      const ground = await grounds.ground(VENUE, b.groundId, session);
      const type = await grounds.eventType(VENUE, b.eventTypeId, session);
      const fromAt = wholeSecond(new Date(from));
      const toAt = wholeSecond(new Date(to));
      checkInterval({ ground, type, now: movedAt }, fromAt, toAt);
      await refuseClashes({ bookings, grounds }, { bookingId: id, groundId: b.groundId, fromAt, toAt, type }, movedAt, session);
      await bookings.stamp(id, { fromAt, toAt, movedAt, previousFrom: b.fromAt, previousTo: b.toAt }, session);
      await events.record(eventOf(id, 'moved', movedAt, {
        from: fromAt, to: toAt, previousFrom: b.fromAt, previousTo: b.toAt,
      }), session);
      const { heldFrom, heldTo } = shadowOf(fromAt, toAt, type);
      return {
        bookingId: id, from: iso(fromAt), to: iso(toAt), groundHeldFrom: iso(heldFrom), groundHeldTo: iso(heldTo),
        movedAt: iso(movedAt),
      };
    });
    log.event('moved', id);
    return moved;
  }

  return { move };
}

module.exports = { makeMoveService };
