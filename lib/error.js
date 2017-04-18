function error(err, req, res, next) { // eslint-disable-line
  const { name = 'internalServerError', code = 500, message } = err;
  return res.status(code).json({ name, code, message });
}

module.exports = function Error(app) {
  app.all('*', function(req, res, next) { // eslint-disable-line
    next(app.handler.notFound());
  });

  app.use(error);
  return true;
};
