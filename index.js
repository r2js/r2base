const express = require('express');
const load = require('r2load');
const http = require('http');
const utils = require('./lib/utils');
const handler = require('./lib/handler');
const _ = require('underscore');
const log = require('debug')('r2:base');

module.exports = ({
  env = 'development',
  port = 3001,
  tz = 'UTC',
} = {}) => {
  log('app initialized');
  const getEnv = process.env.NODE_ENV || env;
  const getPort = process.env.NODE_PORT || port;
  process.env.TZ = tz;

  const app = express();
  const server = http.createServer(app);
  app.set('env', getEnv);
  app.set('port', getPort);

  const toString = Object.prototype.toString;
  return Object.assign(app, load({ baseDir: __dirname }), {
    utils,
    handler,

    start() {
      this.services = {};
      return this.load(`config/${getEnv}.js`);
    },

    listen() {
      this.local('lib/error.js');
      this.into(app);
      this.server = server.listen(getPort, () => {
        log('server listening, port: %s', getPort);
      });
    },

    service(name) {
      return this.services[name];
    },

    config(key) {
      const config = this.services[`config/${getEnv}`];

      // return clone, do not mutate!
      if (toString.call(config[key]) === '[object Object]') {
        return Object.assign({}, config[key]);
      }

      return config[key];
    },

    hasServices(services) {
      const serviceArr = this.utils.split(services);
      const diff = _.difference(serviceArr, Object.keys(this.services));

      if (diff.length) {
        return log(`The service depends on the [${diff.join(', ')}] services`);
      }

      return true;
    },

    setService(...args) {
      const { object, name, opts } = this.resolveService(...args);

      if (name && object && typeof object === 'function') {
        if (this.services[name]) {
          log(`be careful, you are overriding ${name} service!`);
        }

        const instance = object.call(object, app, opts);
        Object.assign(this.services, { [name]: instance });
      }
    },
  });
};
