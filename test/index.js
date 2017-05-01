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

    it('should not validate wrong object, en', () => {
      const app = r2base({ baseDir: __dirname });
      const isFailed = app.utils.isFailed({ b: 1 }, { a: 'required' }, {
        lang: 'en',
        attributes: {
          en: { a: 'a_EN' },
        },
      });
      expect(isFailed).to.deep.equal({ a: ['The a_EN field is required.'] });
    });

    it('should not validate wrong object, tr', () => {
      const app = r2base({ baseDir: __dirname });
      const isFailed = app.utils.isFailed({ b: 1 }, { a: 'required' }, {
        lang: 'tr',
        attributes: {
          tr: { a: 'a_TR' },
        },
      });
      expect(isFailed).to.deep.equal({ a: ['a_TR alanı gerekli.'] });
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

    it('should generate and check expired token', (done) => {
      const app = r2base({ baseDir: __dirname });
      const tokenData = app.utils.getToken({ expires: app.utils.expiresIn(-3) }, '1234');
      app.utils.accessToken(tokenData.token, { secret: '1234' })
        .then(done)
        .catch((err) => {
          expect(err).to.equal('token expired!');
          done();
        });
    });

    it('should check invalid token', (done) => {
      const app = r2base({ baseDir: __dirname });
      app.utils.accessToken('invalidToken', { secret: '1234' })
        .then(done)
        .catch((err) => {
          expect(err).to.equal('token verification failed!');
          done();
        });
    });

    it('should generate and check valid token', () => {
      const app = r2base({ baseDir: __dirname });
      const tokenData = app.utils.getToken({ expires: app.utils.expiresIn(3) }, '1234');
      return app.utils.accessToken(tokenData.token, { secret: '1234' });
    });

    it('should not check access token without jwt config', () => {
      const app = r2base({ baseDir: __dirname });
      const token = app.utils.accessToken('token');
      expect(token).to.equal(undefined);
    });

    it('should split strings', () => {
      const app = r2base({ baseDir: __dirname });
      const params = app.utils.split('param1|param2');
      expect(params).to.deep.equal(['param1', 'param2']);
    });

    it('should check valid services', () => {
      const app = r2base({ baseDir: __dirname });
      const service = require('./service/c'); // eslint-disable-line
      app
        .start()
        .serve(service, 'ServiceC')
        .load('controller/c.js')
        .into(app);

      expect(app.hasServices('config/development|ServiceC|controller/c')).to.equal(true);
    });

    it('should check invalid services', () => {
      const app = r2base({ baseDir: __dirname });
      const service = require('./service/c'); // eslint-disable-line
      app
        .start()
        .serve(service, 'ServiceC')
        .load('controller/c.js')
        .into(app);

      expect(app.hasServices('ServiceX')).to.equal(undefined);
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

    it('GET /ok should return 200', (done) => {
      request(handler).get('/ok').expect(200).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'ok', code: 200, data: { a: 1 } });
        done();
      });
    });

    it('POST /created should return 201', (done) => {
      request(handler).post('/created').expect(201).end(done);
    });

    it('DELETE /noContent should return 204', (done) => {
      request(handler).delete('/noContent').expect(204).end(done);
    });

    it('GET /badRequest should return 400', (done) => {
      request(handler).get('/badRequest').expect(400).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'badRequest', code: 400, message: { a: 2 } });
        done(err);
      });
    });

    it('GET /unauthorized should return 401', (done) => {
      request(handler).get('/unauthorized').expect(401).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'unauthorized', code: 401, message: { a: 3 } });
        done(err);
      });
    });

    it('GET /forbidden should return 403', (done) => {
      request(handler).get('/forbidden').expect(403).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'forbidden', code: 403, message: { a: 4 } });
        done(err);
      });
    });

    it('GET /notFound should return 404', (done) => {
      request(handler).get('/notFound').expect(404).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'notFound', code: 404, message: { a: 5 } });
        done(err);
      });
    });

    it('GET /methodNotAllowed should return 405', (done) => {
      request(handler).get('/methodNotAllowed').expect(405).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'methodNotAllowed', code: 405, message: { a: 6 } });
        done(err);
      });
    });

    it('GET /gone should return 410', (done) => {
      request(handler).get('/gone').expect(410).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'gone', code: 410, message: { a: 7 } });
        done(err);
      });
    });

    it('GET /unsupportedMediaType should return 415', (done) => {
      request(handler).get('/unsupportedMediaType').expect(415).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'unsupportedMediaType', code: 415, message: { a: 8 } });
        done(err);
      });
    });

    it('GET /unprocessableEntity should return 422', (done) => {
      request(handler).post('/unprocessableEntity').expect(422).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'unprocessableEntity', code: 422, message: { a: 9 } });
        done(err);
      });
    });

    it('GET /tooManyRequests should return 429', (done) => {
      request(handler).get('/tooManyRequests').expect(429).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'tooManyRequests', code: 429, message: { a: 10 } });
        done(err);
      });
    });

    it('GET /internalServerError should return 500', (done) => {
      request(handler).get('/internalServerError').expect(500).end((err, res) => {
        expect(res.body).to.deep.equal({ name: 'internalServerError', code: 500, message: { a: 11 } });
        done(err);
      });
    });

    it('GET /xyz should return 404', (done) => {
      request(handler).get('/xyz').expect(404).end(done);
    });
  });
});
