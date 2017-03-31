module.exports = (app) => {
  app.get('/controller/a', (req, res) => {
    res.json({ controller: 'a' });
  });

  return this;
};
