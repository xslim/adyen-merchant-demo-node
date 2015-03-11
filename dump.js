var util = require('util')

function dump(x) {
  console.log(util.inspect(x, {showHidden: false, depth: null}));
}

module.exports = dump;
