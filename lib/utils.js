const Validator = require('validatorjs');
const crypto = require('crypto');
const jwt = require('jwt-simple');
const log = require('debug')('r2:base:utils');

const toString = Object.prototype.toString;
module.exports = {
  isFailed(data, rules, options = {}) {
    const { lang, attributes = {} } = options;
    const messages = {};
    if (lang) {
      Object.assign(messages, Validator.getMessages(lang));
    }

    const validator = new Validator(data, rules, messages);
    validator.setAttributeNames(attributes[lang] || attributes);
    if (validator.fails()) {
      return validator.errors.all();
    }

    return false;
  },

  random(len) {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
  },

  hash(passwd, salt) {
    return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
  },

  expiresIn(numDays) {
    const date = new Date();
    return date.setDate(date.getDate() + numDays);
  },

  getToken(payload, secret) {
    const { expires } = payload;
    const token = jwt.encode(payload, secret);
    return { token, expires };
  },

  decodeToken(token, secret) {
    return jwt.decode(token, secret);
  },

  split(str) {
    let getStr = str;

    if (toString.call(getStr) === '[object String]') {
      getStr = getStr.split('|');
    }

    return getStr;
  },

  accessToken(token, conf) {
    if (!conf) {
      return log('jwt config not found!');
    }

    return new Promise((resolve, reject) => {
      try {
        const decoded = this.decodeToken(token, conf.secret);

        if (decoded.expires <= Date.now()) {
          return reject('token expired!');
        }

        return resolve(decoded);
      } catch (e) {
        return reject('token verification failed!');
      }
    });
  },
};
