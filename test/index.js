const chai = require('chai');
const request = require('supertest');
const r2base = require('../index');

const expect = chai.expect;

describe('r2', () => {
  describe('express app', () => {
    it('should start an express app', () => {
      const app = r2base({ baseDir: __dirname });
      app.start().listen();
      expect(app.get).to.not.equal(undefined);
      expect(app.post).to.not.equal(undefined);
      expect(app.put).to.not.equal(undefined);
      expect(app.delete).to.not.equal(undefined);
    });

    it('should set correct parameters', () => {
      const app = r2base({ baseDir: __dirname, env: 'production', port: 8080 });
      app.start().listen();
      expect(app.get).to.not.equal(undefined);
      expect(app.get('env')).to.equal('production');
      expect(app.get('port')).to.equal(8080);
    });

    it('GET /test should return 404', (done) => {
      const app = r2base({ baseDir: __dirname, port: 9001 });
      app.start().listen();
      request.agent(app.server);
      request(app)
        .get('/test')
        .expect(404)
        .end(done);
    });

    it('GET /controller/a should return 200', (done) => {
      const app = r2base({ baseDir: __dirname, port: 9002 });
      app.start().load('test/controller').listen();
      request.agent(app.server);
      request(app)
        .get('/controller/a')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.not.equal(undefined);
          expect(res.body.controller).to.equal('a');
          return done();
        });
    });
  });

  describe('express middleware', () => {
    it('GET /controller/b should return request data from middleware', (done) => {
      const app = r2base({ baseDir: __dirname, port: 9003 });
      app
        .start()
        .use((req, res, next) => {
          req.data = { controller: 'b' };
          next();
        })
        .load('test/controller/b.js')
        .listen();
      request.agent(app.server);
      request(app)
        .get('/controller/b')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.not.equal(undefined);
          expect(res.body.controller).to.equal('b');
          return done();
        });
    });

    it('GET /controller/b should return request data from middleware file', (done) => {
      const app = r2base({ baseDir: __dirname, port: 9004 });
      app
        .start()
        .load('test/middleware/b.js')
        .load('test/controller/b.js')
        .listen();
      request.agent(app.server);
      request(app)
        .get('/controller/b')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.not.equal(undefined);
          expect(res.body.controller).to.equal('b');
          return done();
        });
    });

    it('GET /controller/c should return data from service', (done) => {
      const app = r2base({ baseDir: __dirname, port: 9005 });
      const service = require('./service/c'); // eslint-disable-line
      app
        .start()
        .serve(service, 'ServiceC')
        .load('test/controller/c.js')
        .listen();
      request.agent(app.server);
      request(app)
        .get('/controller/c')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.not.equal(undefined);
          expect(res.body.service).to.equal('c');
          return done();
        });
    });
  });
});
