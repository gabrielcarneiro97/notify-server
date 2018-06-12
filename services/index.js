const calculator = require('./calculator.service');
const firebase = require('./firebase.service');

module.exports = {
  ...calculator,
  ...firebase,
};
