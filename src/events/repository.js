'use strict';
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  venueId: { type: String, required: true },
  bookingId: { type: String, required: true },
  kind: {
    type: String, required: true,
    enum: ['requested', 'confirmed', 'moved', 'cancelled', 'expired', 'charged', 'invoiced', 'rechecked'],
  },
  at: { type: Date, required: true },
  actorId: { type: String, required: true },
  data: { type: Object, default: {} },
}, { collection: 'events' });

/** The log is append-only: any attempt to change or remove an event is refused here, whoever makes it. */
function refuse() {
  throw new Error('events are append-only: an event is never changed or deleted');
}
const CHANGES = ['updateOne', 'updateMany', 'replaceOne', 'findOneAndUpdate', 'findOneAndReplace', 'deleteOne',
  'deleteMany', 'findOneAndDelete'];
eventSchema.pre(CHANGES, { document: false, query: true }, refuse);
eventSchema.pre(['updateOne', 'deleteOne'], { document: true, query: false }, refuse);
eventSchema.pre('save', function refuseRewrite() {
  if (!this.isNew) refuse();
});

const Event = mongoose.model('Event', eventSchema);

/** Writes the event of one change inside the transaction of that change. */
async function record(event, session) {
  await Event.create([{ data: {}, ...event }], { session });
}

/** A booking's events, oldest first (same-time events in the order they were written). */
function forBooking(venueId, bookingId) {
  return Event.find({ venueId, bookingId }).sort({ at: 1, _id: 1 }).lean();
}

module.exports = { record, forBooking };
