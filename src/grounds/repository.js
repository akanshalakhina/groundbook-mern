'use strict';
const mongoose = require('mongoose');

const Venue = mongoose.model('Venue', new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
}, { collection: 'venues' }));

const groundSchema = new mongoose.Schema({
  venueId: { type: String, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  opens: { type: String, required: true },
  closes: { type: String, required: true },
  sundayOpens: { type: String, required: true },
  sundayCloses: { type: String, required: true },
}, { collection: 'grounds' });
groundSchema.index({ venueId: 1, code: 1 }, { unique: true });
const Ground = mongoose.model('Ground', groundSchema);

const eventTypeSchema = new mongoose.Schema({
  venueId: { type: String, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  setupMinutes: { type: Number, required: true },
  teardownMinutes: { type: Number, required: true },
}, { collection: 'eventTypes' });
eventTypeSchema.index({ venueId: 1, code: 1 }, { unique: true });
const EventType = mongoose.model('EventType', eventTypeSchema);

function venueExists(slug) {
  return Venue.exists({ slug });
}

/** The venue, its grounds and its event types - written at the first start only. */
async function addVenue({ slug, name, grounds, eventTypes }) {
  await Venue.create({ slug, name });
  await Ground.insertMany(grounds.map((g) => ({ venueId: slug, ...g })));
  await EventType.insertMany(eventTypes.map((t) => ({ venueId: slug, ...t })));
}

/** A venue's grounds in code order, as plain objects. */
function groundsOf(venueId) {
  return Ground.find({ venueId }).sort({ code: 1 }).lean();
}

/** Reads that a transaction may run: given its session, they read inside it. */
function ground(venueId, code, session) {
  return Ground.findOne({ venueId, code }).session(session).lean();
}

function eventTypesOf(venueId, session) {
  return EventType.find({ venueId }).session(session).lean();
}

function eventType(venueId, code, session) {
  return EventType.findOne({ venueId, code }).session(session).lean();
}

module.exports = { venueExists, addVenue, groundsOf, ground, eventTypesOf, eventType };
