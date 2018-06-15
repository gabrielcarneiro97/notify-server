const calculator = require('./calculator.service');
const firebase = require('./firebase.service');
const zenvia = require('./zenvia.service');
const ssl = require('./ssl.service');

module.exports = {
  ...calculator,
  ...firebase,
  ...zenvia,
  ...ssl,
};
