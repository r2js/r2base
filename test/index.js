const chai = require('chai');
const request = require('supertest');
const r2base = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

describe('r2base', () => {
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

    it('should load config file', () => {
      const app = r2base({ baseDir: __dirname });
      app.start().listen();
      expect(app.config('a')).to.equal(1);
      expect(app.config('b')).to.equal(2);
      expect(app.config('c')).to.deep.equal({ x: 1 });
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
      app.start().load('controller').listen();
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
        .load('controller/b.js')
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
        .load('middleware/b.js')
        .load('controller/b.js')
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
        .load('controller/c.js')
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

  describe('utils', () => {
    it('should validate object', () => {
      const app = r2base({ baseDir: __dirname });
      const isFailed = app.utils.isFailed({ a: 1 }, { a: 'required' });
      expect(isFailed).to.equal(false);
    });

    it('should not validate wrong object', () => {
      const app = r2base({ baseDir: __dirname });
      const isFailed = app.utils.isFailed({ b: 1 }, { a: 'required' });
      expect(isFailed).to.deep.equal({ a: ['The a field is required.'] });
    });

    it('should generate random key', () => {
      const app = r2base({ baseDir: __dirname });
      const random = app.utils.random(32);
      expect(random.length).to.equal(32);
    });

    it('should generate hash', () => {
      const app = r2base({ baseDir: __dirname });
      const hash = app.utils.hash('1234', 'abcd');
      expect(hash).to.not.equal(undefined);
    });

    it('should generate and decode token', () => {
      const app = r2base({ baseDir: __dirname });
      const tokenData = app.utils.getToken({ expires: app.utils.expiresIn(3) }, '1234');
      expect(tokenData.token).to.not.equal(undefined);
      expect(tokenData.expires).to.not.equal(undefined);
      const decodeToken = app.utils.decodeToken(tokenData.token, '1234');
      expect(decodeToken.expires).to.equal(tokenData.expires);
    });
  });

  describe('handler', () => {
    let handler;
    before((done) => {
      handler = r2base({ baseDir: __dirname, port: 9006 });
      handler.start().load('controller').listen();
      request.agent(handler.server);
      done();
    });

    it('GET /OK should return 200', (done) => {
      request(handler).get('/OK').expect(200).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'OK', code: 200, data: { a: 1 } });
        done();
      });
    });

    it('POST /Created should return 201', (done) => {
      request(handler).post('/Created').expect(201).end(done);
    });

    it('DELETE /NoContent should return 204', (done) => {
      request(handler).delete('/NoContent').expect(204).end(done);
    });

    it('GET /BadRequest should return 400', (done) => {
      request(handler).get('/BadRequest').expect(400).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'BadRequest', code: 400, message: { a: 2 } });
        done(err);
      });
    });

    it('GET /Unauthorized should return 401', (done) => {
      request(handler).get('/Unauthorized').expect(401).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'Unauthorized', code: 401, message: { a: 3 } });
        done(err);
      });
    });

    it('GET /Forbidden should return 403', (done) => {
      request(handler).get('/Forbidden').expect(403).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'Forbidden', code: 403, message: { a: 4 } });
        done(err);
      });
    });

    it('GET /NotFound should return 404', (done) => {
      request(handler).get('/NotFound').expect(404).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'NotFound', code: 404, message: { a: 5 } });
        done(err);
      });
    });

    it('GET /MethodNotAllowed should return 405', (done) => {
      request(handler).get('/MethodNotAllowed').expect(405).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'MethodNotAllowed', code: 405, message: { a: 6 } });
        done(err);
      });
    });

    it('GET /Gone should return 410', (done) => {
      request(handler).get('/Gone').expect(410).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'Gone', code: 410, message: { a: 7 } });
        done(err);
      });
    });

    it('GET /UnsupportedMediaType should return 415', (done) => {
      request(handler).get('/UnsupportedMediaType').expect(415).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'UnsupportedMediaType', code: 415, message: { a: 8 } });
        done(err);
      });
    });

    it('GET /UnprocessableEntity should return 422', (done) => {
      request(handler).post('/UnprocessableEntity').expect(422).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'UnprocessableEntity', code: 422, message: { a: 9 } });
        done(err);
      });
    });

    it('GET /TooManyRequests should return 429', (done) => {
      request(handler).get('/TooManyRequests').expect(429).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'TooManyRequests', code: 429, message: { a: 10 } });
        done(err);
      });
    });

    it('GET /InternalServerError should return 500', (done) => {
      request(handler).get('/InternalServerError').expect(500).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'InternalServerError', code: 500, message: { a: 11 } });
        done(err);
      });
    });

    it('GET /xyz should return 404', (done) => {
      request(handler).get('/xyz').expect(404).end(done);
    });
  });
});
