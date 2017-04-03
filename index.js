const express = require('express');
const load = require('r2load');
const http = require('http');
const utils = require('./lib/utils');
const debug = require('debug')('r2:index');

module.exports = ({
  env = 'development',
  port = 3001,
  baseDir,
} = {}) => {
  debug('app initialized');
  const getEnv = process.env.NODE_ENV || env;
  const getPort = process.env.NODE_PORT || port;
  const app = express();
  const server = http.createServer(app);
  app.set('env', getEnv);
  app.set('port', getPort);
  app.set('baseDir', baseDir);

  const toString = Object.prototype.toString;
  return Object.assign(app, load({ baseDir: __dirname }), {
    utils,

    start() {
      this.services = {};
      return this.load(`config/${env}.js`);
    },

    listen() {
      this.into(app);
      this.server = server.listen(getPort, () => {
        debug('server listening, port: %s', getPort);
      });
    },

    service(name) {
      return this.services[name];
    },

    config(key) {
      const config = this.services[`config/${env}`];

      if (toString.call(config[key]) === '[object Object]') {
        return Object.assign({}, config[key]);
      }

      return config[key];
    },
  });
};
