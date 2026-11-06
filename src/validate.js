'use strict';
const { ValidationError } = require('./errors');

/** Checks a request part against a zod schema; a mismatch is a 400 naming each bad field. */
function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  }
  return result.data;
}

module.exports = { parse };
