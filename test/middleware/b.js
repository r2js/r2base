module.exports = (app) => {
  app.use((req, res, next) => {
    req.data = { controller: 'b' };
    next();
  });

  return this;
};
