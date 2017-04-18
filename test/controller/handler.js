const error = (handler, data) => (req, res, next) => next(handler(data));

module.exports = (app) => {
  app.get('/ok', (req, res) => app.handler.ok({ a: 1 }, res));
  app.post('/created', (req, res) => app.handler.created({ type: 'created' }, res));
  app.delete('/noContent', (req, res) => app.handler.noContent({ type: 'noContent' }, res));
  app.get('/badRequest', error(app.handler.badRequest, { a: 2 }));
  app.get('/unauthorized', error(app.handler.unauthorized, { a: 3 }));
  app.get('/forbidden', error(app.handler.forbidden, { a: 4 }));
  app.get('/notFound', error(app.handler.notFound, { a: 5 }));
  app.get('/methodNotAllowed', error(app.handler.methodNotAllowed, { a: 6 }));
  app.get('/gone', error(app.handler.gone, { a: 7 }));
  app.get('/unsupportedMediaType', error(app.handler.unsupportedMediaType, { a: 8 }));
  app.post('/unprocessableEntity', error(app.handler.unprocessableEntity, { a: 9 }));
  app.get('/tooManyRequests', error(app.handler.tooManyRequests, { a: 10 }));
  app.get('/internalServerError', error(app.handler.internalServerError, { a: 11 }));
  return this;
};
