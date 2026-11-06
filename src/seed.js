'use strict';
const fs = require('fs');
const path = require('path');
const grounds = require('./grounds/repository');

const VENUE = 'deccan';

/** The rows of a seed CSV as objects keyed by its header (the files hold plain comma-separated values). */
function readCsv(file) {
  const [header, ...rows] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line.trim());
  const keys = header.split(',').map((k) => k.trim());
  return rows.map((row) => {
    const cells = row.split(',').map((c) => c.trim());
    return Object.fromEntries(keys.map((k, i) => [k, cells[i]]));
  });
}

/** Loads the Deccan venue, its four grounds and its six event types with their buffers - once. A second start adds nothing. */
async function seed({ settings }) {
  if (await grounds.venueExists(VENUE)) return;
  await grounds.addVenue({
    slug: VENUE,
    name: 'Deccan',
    grounds: readCsv(path.join(settings.seedDir, 'grounds.csv')).map((g) => ({
      code: g.code, name: g.name, opens: g.opens, closes: g.closes, sundayOpens: g.sunday_opens, sundayCloses: g.sunday_closes,
    })),
    eventTypes: readCsv(path.join(settings.seedDir, 'event_types.csv')).map((t) => ({
      code: t.code, name: t.name, setupMinutes: Number(t.setup_minutes), teardownMinutes: Number(t.teardown_minutes),
    })),
  });
}

module.exports = { seed };
