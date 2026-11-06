'use strict';

/** The same instant without its milliseconds: every time the app stores and answers is to the whole second. */
function wholeSecond(date) {
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
}

/** An instant as the API writes it: ISO 8601 in UTC, to the whole second, ending in Z. */
function iso(date) {
  return wholeSecond(date).toISOString().replace('.000Z', 'Z');
}

module.exports = { wholeSecond, iso };
