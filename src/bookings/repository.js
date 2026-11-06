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
  confirmedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  lateCancel: { type: Boolean, default: false },
}, { collection: 'bookings' }));

/** The next booking id at the venue: 'BK' and a number of at least four digits, BK0001 first. */
async function nextId(venueId) {
  const count = await Booking.countDocuments({ venueId });
  return `BK${String(count + 1).padStart(4, '0')}`;
}

async function insert(booking) {
  await Booking.create(booking);
}

function byId(venueId, bookingId) {
  return Booking.findOne({ venueId, bookingId }).lean();
}

/** A transition: the booking's new state and the fields stamped with it. */
async function stamp(bookingId, fields) {
  await Booking.updateOne({ bookingId }, { $set: fields });
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
function liveOnDay(venueId, groundId, date, now, exceptId) {
  return Booking.find({
    venueId, groundId, fromAt: dayRange(date), bookingId: { $ne: exceptId },
    $or: [{ state: 'confirmed' }, { state: 'requested', holdUntil: { $gte: now } }],
  }).lean();
}

/** A ground's bookings that start on this date (UTC), in `from` order. */
function onDay(venueId, groundId, date) {
  return Booking.find({ venueId, groundId, fromAt: dayRange(date) }).sort({ fromAt: 1 }).lean();
}

module.exports = { nextId, insert, byId, stamp, liveOnDay, onDay };
