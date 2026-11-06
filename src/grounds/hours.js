'use strict';

/** A ground's hours on a date: Sunday has its own, every other day the weekday ones. Dates are read in UTC. */
function hoursOn(g, date) {
  const sunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
  return sunday ? { opens: g.sundayOpens, closes: g.sundayCloses } : { opens: g.opens, closes: g.closes };
}

module.exports = { hoursOn };
