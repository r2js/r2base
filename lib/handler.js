require('extend-error');

function handler(name, code = 200, data = null, res) {
  res.status(code).json({ name, code, data });
}

exports.OK = (message, res) => handler('OK', 200, message, res);
exports.Created = (message, res) => handler('Created', 201, message, res);
exports.NoContent = (message, res) => handler('NoContent', 204, message, res);
exports.BadRequest = Error.extend('BadRequest', 400);
exports.Unauthorized = Error.extend('Unauthorized', 401);
exports.Forbidden = Error.extend('Forbidden', 403);
exports.NotFound = Error.extend('NotFound', 404);
exports.MethodNotAllowed = Error.extend('MethodNotAllowed', 405);
exports.Gone = Error.extend('Gone', 410);
exports.UnsupportedMediaType = Error.extend('UnsupportedMediaType', 415);
exports.UnprocessableEntity = Error.extend('UnprocessableEntity', 422);
exports.TooManyRequests = Error.extend('TooManyRequests', 429);
exports.InternalServerError = Error.extend('InternalServerError', 500);
