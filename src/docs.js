'use strict';

/** A documented refusal: its status, and one problem+json example per type it can carry. */
function refusal(description, ...examples) {
  const content = examples.length === 1
    ? { example: examples[0] }
    : { examples: Object.fromEntries(examples.map((e) => [e.type.replace('/errors/', ''), { value: e }])) };
  return { description, content: { 'application/problem+json': content } };
}

/** One problem+json example body. */
function problem(status, type, title, detail, instance, extras = {}) {
  return { type, title, status, detail, instance, ...extras };
}

function ok(description, example) {
  return { description, content: { 'application/json': { example } } };
}

function pathParam(name, description) {
  return { name, in: 'path', required: true, schema: { type: 'string' }, description };
}

module.exports = { refusal, problem, ok, pathParam };
