const Validator = require('validatorjs');
const crypto = require('crypto');
const jwt = require('jwt-simple');
const _ = require('underscore');
const log = require('debug')('r2:base:utils');

const mapAttributes = (obj, parent) => (
  _.mapObject(obj, (v, k) => {
    if (typeof v === 'string') {
      return parent ? `${v}|${parent}.${k}` : `${v}|${k}`;
    } else if (typeof v === 'object') {
      return mapAttributes(v, k);
    }
    return v;
  })
);

const toString = Object.prototype.toString;

module.exports = {
  isFailed(data, rules, options = {}) {
    const { lang, attributes = {}, setMapAttributes } = options;
    let messages = {};
    if (lang) {
      Object.assign(messages, Validator.getMessages(lang));
    }

    if (setMapAttributes) {
      messages = mapAttributes(messages);
    }

    const validator = new Validator(data, rules, messages);
    validator.setAttributeNames(attributes[lang] || attributes);
    if (validator.fails()) {
      const errors = validator.errors.all();

      if (!setMapAttributes) {
        return errors;
      }

      const invalidatedArr = [];
      _.each(errors, (value, path) => {
        _.each(value, (messageVal) => {
          const [message, type] = messageVal.split('|');
          invalidatedArr.push({ path, message, type });
        });
      });

      return invalidatedArr;
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
