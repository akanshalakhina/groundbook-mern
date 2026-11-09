'use strict';
const mongoose = require('mongoose');

const Booking = mongoose.model('Booking', new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  venueId: { type: String, required: true },
  groundId: { type: String, required: true },
  eventTypeId: { type: String, required: true },
  clubName: { type: String, required: true },
  fromAt: { type: Date, required: true },
  toAt: { type: Date, required: true },
  state: { type: String, enum: ['requested', 'confirmed', 'cancelled', 'expired'], required: true },
  requestedAt: { type: Date, required: true },
  holdUntil: { type: Date, required: true },
  movedAt: { type: Date, default: null },
  previousFrom: { type: Date, default: null },
  previousTo: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  lateCancel: { type: Boolean, default: false },
}, { collection: 'bookings' }));

/** The next booking id at the venue: 'BK' and a number of at least four digits, BK0001 first. */
async function nextId(venueId) {
  const count = await Booking.countDocuments({ venueId });
  return `BK${String(count + 1).padStart(4, '0')}`;
}

async function insert(booking, session) {
  await Booking.create([booking], { session });
}

function byId(venueId, bookingId, session) {
  return Booking.findOne({ venueId, bookingId }).session(session).lean();
}

/** A change of the booking document (a transition or a move); inside a transaction when given its session. */
async function stamp(bookingId, fields, session) {
  await Booking.updateOne({ bookingId }, { $set: fields }, { session });
}

/** The day's start and the next day's, for a date read in UTC. */
function dayRange(date) {
  const start = new Date(`${date}T00:00:00Z`);
  return { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/**
 * The live bookings on a ground and date, leaving out one booking: confirmed ones, and requested ones whose hold has not
 * passed. One query.
 */
function liveOnDay(venueId, groundId, date, now, exceptId, session) {
  return Booking.find({
    venueId, groundId, fromAt: dayRange(date), bookingId: { $ne: exceptId },
    $or: [{ state: 'confirmed' }, { state: 'requested', holdUntil: { $gte: now } }],
  }).session(session).lean();
}

/** A ground's bookings that start on this date (UTC), in `from` order. */
function onDay(venueId, groundId, date) {
  return Booking.find({ venueId, groundId, fromAt: dayRange(date) }).sort({ fromAt: 1 }).lean();
}

module.exports = { nextId, insert, byId, stamp, liveOnDay, onDay };
