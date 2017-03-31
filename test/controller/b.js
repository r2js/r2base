module.exports = (app) => {
  app.get('/controller/b', (req, res) => {
    res.json(req.data);
  });

  return this;
};
