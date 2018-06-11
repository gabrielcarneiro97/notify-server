const fs = require('fs');
const { Remessa } = require('./Remessa');

const rem = new Remessa(fs.readFileSync('./CNAB240_1630_32135_050418_268.REM'));

console.log(rem);
