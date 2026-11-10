'use strict';

/** Every log line goes to stdout, one line each, never to a file inside the container. */
function line(text) {
  console.log(text);
}

/** One line per request, once its answer is sent: method, path, status (never a body: it names the club). */
function requests(req, res, next) {
  res.on('finish', () => line(`${req.method} ${req.path} ${res.statusCode}`));
  next();
}

/** One line per event, after its transaction has committed. */
function event(kind, id) {
  line(`event ${kind} ${id}`);
}

module.exports = { line, requests, event };
