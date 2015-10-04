var getopt = require('./getopt');

module.exports = function(av,opt) { return getopt.getopt(av,opt) };
module.exports.getopt = getopt.getopt;
module.exports.nextopt = getopt.nextopt;
