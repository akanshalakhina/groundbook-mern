'use strict';
const crypto = require('crypto');
const { DomainError, ValidationError } = require('./index');
const log = require('../log');

function problem(req, res, { status, type, title, detail, extras = {} }) {
  res.status(status).type('application/problem+json')
    .json({ type, title, status, detail, instance: req.path, ...extras });
}

/** '/venues/{venue}/grounds' -> a pattern that matches '/venues/deccan/grounds'. */
function pathPattern(openapiPath) {
  return new RegExp(`^${openapiPath.replace(/\{[^}]+\}/g, '[^/]+')}$`);
}

/**
 * The last route, built from the documented paths (the one list of what the app serves): a known path asked with a
 * method it does not serve is a 405 naming the methods it does, and any other path is a 404. Both have the shape of
 * every other error; no ticket names a type for them, so they carry the standard "about:blank".
 */
function makeLastRoute(paths) {
  const known = Object.entries(paths).map(([p, ops]) => ({ pattern: pathPattern(p), methods: Object.keys(ops) }));
  return function lastRoute(req, res) {
    const path = known.find((k) => k.pattern.test(req.path));
    if (path) {
      const allowed = path.methods.map((m) => m.toUpperCase()).join(', ');
      res.set('Allow', allowed);
      problem(req, res, {
        status: 405, type: 'about:blank', title: 'Method Not Allowed', detail: `${req.path} answers ${allowed} only`,
      });
      return;
    }
    problem(req, res, {
      status: 404, type: 'about:blank', title: 'Not Found', detail: `Nothing is served at ${req.path}`,
    });
  };
}

/** A body that is not JSON at all is a malformed body like any other: 400 /errors/validation. */
function notJson() {
  return new ValidationError([{ field: 'body', message: 'The body is not valid JSON' }]);
}

/**
 * The one place that turns a thrown error into an answer. A refusal answers with its own status and type; anything
 * else is an unexpected error: a generic 500 whose request id is also written to the log, so the two can be matched
 * without the answer giving the error away. Express knows an error handler by its four arguments, so `next` stays
 * although it is not called.
 */
function errorHandler(err, req, res, next) {
  const refusal = err.type === 'entity.parse.failed' ? notJson() : err;
  if (refusal instanceof DomainError) {
    problem(req, res, {
      status: refusal.status, type: refusal.type, title: refusal.title, detail: refusal.message, extras: refusal.extras(),
    });
    return;
  }
  const requestId = crypto.randomUUID();
  log.line(`request ${requestId} failed: ${req.method} ${req.path}: ${err.stack || err}`);
  problem(req, res, {
    status: 500, type: '/errors/internal', title: 'Internal error',
    detail: 'Something went wrong on our side; quote the request id if you report it', extras: { requestId },
  });
}

module.exports = { makeLastRoute, errorHandler };
