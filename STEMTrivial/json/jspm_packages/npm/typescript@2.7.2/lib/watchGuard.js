/* */ 
(function(process) {
  "use strict";
  if (process.argv.length < 3) {
    process.exit(1);
  }
  var directoryName = process.argv[2];
  var fs = require('@empty');
  try {
    var watcher = fs.watch(directoryName, {recursive: true}, function() {
      return ({});
    });
    watcher.close();
  } catch (_a) {}
  process.exit(0);
})(require('@empty'));
