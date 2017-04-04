const Validator = require('validatorjs');
const crypto = require('crypto');
const jwt = require('jwt-simple');

const toString = Object.prototype.toString;
module.exports = {
  isFailed(data, rules) {
    const validation = new Validator(data, rules);
    if (validation.fails()) {
      return validation.errors.all();
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
};
