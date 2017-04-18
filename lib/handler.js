require('extend-error');

function handler(name, code = 200, data = null, res) {
  res.status(code).json({ name, code, data });
}

exports.ok = (message, res) => handler('ok', 200, message, res);
exports.created = (message, res) => handler('created', 201, message, res);
exports.noContent = (message, res) => handler('noContent', 204, message, res);
exports.badRequest = Error.extend('badRequest', 400);
exports.unauthorized = Error.extend('unauthorized', 401);
exports.forbidden = Error.extend('forbidden', 403);
exports.notFound = Error.extend('notFound', 404);
exports.methodNotAllowed = Error.extend('methodNotAllowed', 405);
exports.gone = Error.extend('gone', 410);
exports.unsupportedMediaType = Error.extend('unsupportedMediaType', 415);
exports.unprocessableEntity = Error.extend('unprocessableEntity', 422);
exports.tooManyRequests = Error.extend('tooManyRequests', 429);
exports.internalServerError = Error.extend('internalServerError', 500);
