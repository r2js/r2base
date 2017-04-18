const error = (handler, data) => (req, res, next) => next(handler(data));

module.exports = (app) => {
  app.get('/OK', (req, res) => app.handler.OK({ a: 1 }, res));
  app.post('/Created', (req, res) => app.handler.Created({ type: 'Created' }, res));
  app.delete('/NoContent', (req, res) => app.handler.NoContent({ type: 'NoContent' }, res));
  app.get('/BadRequest', error(app.handler.BadRequest, { a: 2 }));
  app.get('/Unauthorized', error(app.handler.Unauthorized, { a: 3 }));
  app.get('/Forbidden', error(app.handler.Forbidden, { a: 4 }));
  app.get('/NotFound', error(app.handler.NotFound, { a: 5 }));
  app.get('/MethodNotAllowed', error(app.handler.MethodNotAllowed, { a: 6 }));
  app.get('/Gone', error(app.handler.Gone, { a: 7 }));
  app.get('/UnsupportedMediaType', error(app.handler.UnsupportedMediaType, { a: 8 }));
  app.post('/UnprocessableEntity', error(app.handler.UnprocessableEntity, { a: 9 }));
  app.get('/TooManyRequests', error(app.handler.TooManyRequests, { a: 10 }));
  app.get('/InternalServerError', error(app.handler.InternalServerError, { a: 11 }));
  return this;
};
