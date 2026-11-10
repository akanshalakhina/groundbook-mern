'use strict';

/** A refusal the app gives. Services throw these; the error middleware turns them into problem+json. */
class DomainError extends Error {
  constructor(status, type, title, detail) {
    super(detail);
    this.status = status;
    this.type = type;
    this.title = title;
  }

  /** Extra fields for this refusal's answer (none by default). */
  extras() {
    return {};
  }
}

class ValidationError extends DomainError {
  /** @param errors [{ field, message }] */
  constructor(errors) {
    super(400, '/errors/validation', 'Invalid request', 'The request is not valid');
    this.errors = errors;
  }

  extras() {
    return { errors: this.errors };
  }
}

class NoSuchVenue extends DomainError {
  constructor(venue) {
    super(404, '/errors/no-such-venue', 'No such venue', `There is no venue ${venue}`);
  }
}

class NoSuchGround extends DomainError {
  constructor(ground) {
    super(404, '/errors/no-such-ground', 'No such ground', `This venue has no ground ${ground}`);
  }
}

class NoSuchEventType extends DomainError {
  constructor(code) {
    super(400, '/errors/no-such-event-type', 'No such event type', `There is no event type ${code}`);
  }
}

class NoSuchBooking extends DomainError {
  constructor(id) {
    super(404, '/errors/no-such-booking', 'No such booking', `There is no booking ${id}`);
  }
}

/** A valid body asking for an impossible interval. When it is about the ground's hours, it says them. */
class BadInterval extends DomainError {
  constructor(detail, hours = null) {
    super(400, '/errors/bad-interval', 'Bad interval', detail);
    this.hours = hours;
  }

  extras() {
    return this.hours ? { opens: this.hours.opens, closes: this.hours.closes } : {};
  }
}

class AlreadyStarted extends DomainError {
  constructor() {
    super(409, '/errors/already-started', 'Already started', 'The interval has begun; it can no longer be confirmed or moved');
  }
}

class Cancelled extends DomainError {
  constructor() {
    super(409, '/errors/cancelled', 'Cancelled', 'A cancelled booking cannot be confirmed or moved; request a new one');
  }
}

class AlreadyConfirmed extends DomainError {
  constructor() {
    super(409, '/errors/already-confirmed', 'Already confirmed', 'The booking is already confirmed');
  }
}

class AlreadyOver extends DomainError {
  constructor() {
    super(409, '/errors/already-over', 'Already over', 'The interval has ended; it can no longer be cancelled');
  }
}

class AlreadyCancelled extends DomainError {
  constructor() {
    super(409, '/errors/already-cancelled', 'Already cancelled', 'The booking is already cancelled');
  }
}

/** The shadow clashes with live bookings on the ground: each one named with the range it holds. */
class Overlap extends DomainError {
  constructor(clashesWith) {
    super(409, '/errors/overlap', 'Overlap', 'With setup and teardown counted, the ground is already held then');
    this.clashesWith = clashesWith;
  }

  extras() {
    return { clashesWith: this.clashesWith };
  }
}

class Unavailable extends DomainError {
  constructor() {
    super(503, '/errors/unavailable', 'Unavailable', 'The database cannot be reached');
  }
}

module.exports = {
  DomainError, ValidationError, NoSuchVenue, NoSuchGround, NoSuchEventType, NoSuchBooking, BadInterval, AlreadyStarted,
  Cancelled, AlreadyConfirmed, AlreadyOver, AlreadyCancelled, Overlap, Unavailable,
};
