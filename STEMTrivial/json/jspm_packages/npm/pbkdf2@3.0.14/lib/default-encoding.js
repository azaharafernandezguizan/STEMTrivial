/* */ 
(function(process) {
  var defaultEncoding;
  if (process.browser) {
    defaultEncoding = 'utf-8';
  } else {
    var pVersionMajor = parseInt(process.version.split('.')[0].slice(1), 10);
    defaultEncoding = pVersionMajor >= 6 ? 'utf-8' : 'binary';
  }
  module.exports = defaultEncoding;
})(require('process'));
