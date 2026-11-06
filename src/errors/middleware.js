'use strict';
const { DomainError, ValidationError } = require('./index');

function problem(req, res, { status, type, title, detail, extras = {} }) {
  res.status(status).type('application/problem+json')
    .json({ type, title, status, detail, instance: req.path, ...extras });
}

/**
 * The last route: a path the app does not serve is a 404 in the same shape as every other error. No ticket names a
 * type for it, so it carries the standard "about:blank" (a plain HTTP error, nothing more to say).
 */
function notFound(req, res) {
  problem(req, res, {
    status: 404, type: 'about:blank', title: 'Not Found', detail: `Nothing is served at ${req.path}`,
  });
}

/** A body that is not JSON at all is a malformed body like any other: 400 /errors/validation. */
function notJson() {
  return new ValidationError([{ field: 'body', message: 'The body is not valid JSON' }]);
}

/**
 * The one place that turns a thrown error into an answer. Anything that is not a refusal (a failed write, a bug) is a
 * 500 in the same shape, with a generic detail; no ticket names its type yet, so it is "about:blank". Express knows an
 * error handler by its four arguments, so `next` stays although it is not called.
 */
function errorHandler(err, req, res, next) {
  const refusal = err.type === 'entity.parse.failed' ? notJson() : err;
  if (refusal instanceof DomainError) {
    problem(req, res, {
      status: refusal.status, type: refusal.type, title: refusal.title, detail: refusal.message, extras: refusal.extras(),
    });
    return;
  }
  problem(req, res, {
    status: 500, type: 'about:blank', title: 'Internal Server Error', detail: 'Something went wrong on our side',
  });
}

module.exports = { notFound, errorHandler };
