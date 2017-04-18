function error(err, req, res, next) { // eslint-disable-line
  const { name = 'InternalServerError', code = 500, message, type } = err;
  return res.status(code).json({ name, code, message, type });
}

module.exports = function Error(app) {
  app.all('*', function(req, res, next) { // eslint-disable-line
    next(app.handler.NotFound());
  });

  app.use(error);
  return true;
};
