module.exports = (app) => {
  app.get('/controller/c', (req, res) => {
    res.json(app.service('ServiceC'));
  });

  return this;
};
