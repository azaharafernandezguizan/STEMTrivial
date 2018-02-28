/* */ 
(function(Buffer, process) {
  var SourceMapConsumer = require('source-map').SourceMapConsumer;
  var path = require('path');
  var fs;
  try {
    fs = require('fs');
    if (!fs.existsSync || !fs.readFileSync) {
      fs = null;
    }
  } catch (err) {}
  var errorFormatterInstalled = false;
  var uncaughtShimInstalled = false;
  var emptyCacheBetweenOperations = false;
  var environment = "auto";
  var fileContentsCache = {};
  var sourceMapCache = {};
  var reSourceMap = /^data:application\/json[^,]+base64,/;
  var retrieveFileHandlers = [];
  var retrieveMapHandlers = [];
  function isInBrowser() {
    if (environment === "browser")
      return true;
    if (environment === "node")
      return false;
    return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
  }
  function hasGlobalProcessEventEmitter() {
    return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
  }
  function handlerExec(list) {
    return function(arg) {
      for (var i = 0; i < list.length; i++) {
        var ret = list[i](arg);
        if (ret) {
          return ret;
        }
      }
      return null;
    };
  }
  var retrieveFile = handlerExec(retrieveFileHandlers);
  retrieveFileHandlers.push(function(path) {
    path = path.trim();
    if (/^file:/.test(path)) {
      path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
        return drive ? '' : '/';
      });
    }
    if (path in fileContentsCache) {
      return fileContentsCache[path];
    }
    var contents = null;
    if (!fs) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, false);
      xhr.send(null);
      var contents = null;
      if (xhr.readyState === 4 && xhr.status === 200) {
        contents = xhr.responseText;
      }
    } else if (fs.existsSync(path)) {
      try {
        contents = fs.readFileSync(path, 'utf8');
      } catch (er) {
        contents = '';
      }
    }
    return fileContentsCache[path] = contents;
  });
  function supportRelativeURL(file, url) {
    if (!file)
      return url;
    var dir = path.dirname(file);
    var match = /^\w+:\/\/[^\/]*/.exec(dir);
    var protocol = match ? match[0] : '';
    var startPath = dir.slice(protocol.length);
    if (protocol && /^\/\w\:/.test(startPath)) {
      protocol += '/';
      return protocol + path.resolve(dir.slice(protocol.length), url).replace(/\\/g, '/');
    }
    return protocol + path.resolve(dir.slice(protocol.length), url);
  }
  function retrieveSourceMapURL(source) {
    var fileData;
    if (isInBrowser()) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', source, false);
        xhr.send(null);
        fileData = xhr.readyState === 4 ? xhr.responseText : null;
        var sourceMapHeader = xhr.getResponseHeader("SourceMap") || xhr.getResponseHeader("X-SourceMap");
        if (sourceMapHeader) {
          return sourceMapHeader;
        }
      } catch (e) {}
    }
    fileData = retrieveFile(source);
    var re = /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/)[ \t]*$)/mg;
    var lastMatch,
        match;
    while (match = re.exec(fileData))
      lastMatch = match;
    if (!lastMatch)
      return null;
    return lastMatch[1];
  }
  ;
  var retrieveSourceMap = handlerExec(retrieveMapHandlers);
  retrieveMapHandlers.push(function(source) {
    var sourceMappingURL = retrieveSourceMapURL(source);
    if (!sourceMappingURL)
      return null;
    var sourceMapData;
    if (reSourceMap.test(sourceMappingURL)) {
      var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
      sourceMapData = new Buffer(rawData, "base64").toString();
      sourceMappingURL = source;
    } else {
      sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
      sourceMapData = retrieveFile(sourceMappingURL);
    }
    if (!sourceMapData) {
      return null;
    }
    return {
      url: sourceMappingURL,
      map: sourceMapData
    };
  });
  function mapSourcePosition(position) {
    var sourceMap = sourceMapCache[position.source];
    if (!sourceMap) {
      var urlAndMap = retrieveSourceMap(position.source);
      if (urlAndMap) {
        sourceMap = sourceMapCache[position.source] = {
          url: urlAndMap.url,
          map: new SourceMapConsumer(urlAndMap.map)
        };
        if (sourceMap.map.sourcesContent) {
          sourceMap.map.sources.forEach(function(source, i) {
            var contents = sourceMap.map.sourcesContent[i];
            if (contents) {
              var url = supportRelativeURL(sourceMap.url, source);
              fileContentsCache[url] = contents;
            }
          });
        }
      } else {
        sourceMap = sourceMapCache[position.source] = {
          url: null,
          map: null
        };
      }
    }
    if (sourceMap && sourceMap.map) {
      var originalPosition = sourceMap.map.originalPositionFor(position);
      if (originalPosition.source !== null) {
        originalPosition.source = supportRelativeURL(sourceMap.url, originalPosition.source);
        return originalPosition;
      }
    }
    return position;
  }
  function mapEvalOrigin(origin) {
    var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
    if (match) {
      var position = mapSourcePosition({
        source: match[2],
        line: +match[3],
        column: match[4] - 1
      });
      return 'eval at ' + match[1] + ' (' + position.source + ':' + position.line + ':' + (position.column + 1) + ')';
    }
    match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
    if (match) {
      return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
    }
    return origin;
  }
  function CallSiteToString() {
    var fileName;
    var fileLocation = "";
    if (this.isNative()) {
      fileLocation = "native";
    } else {
      fileName = this.getScriptNameOrSourceURL();
      if (!fileName && this.isEval()) {
        fileLocation = this.getEvalOrigin();
        fileLocation += ", ";
      }
      if (fileName) {
        fileLocation += fileName;
      } else {
        fileLocation += "<anonymous>";
      }
      var lineNumber = this.getLineNumber();
      if (lineNumber != null) {
        fileLocation += ":" + lineNumber;
        var columnNumber = this.getColumnNumber();
        if (columnNumber) {
          fileLocation += ":" + columnNumber;
        }
      }
    }
    var line = "";
    var functionName = this.getFunctionName();
    var addSuffix = true;
    var isConstructor = this.isConstructor();
    var isMethodCall = !(this.isToplevel() || isConstructor);
    if (isMethodCall) {
      var typeName = this.getTypeName();
      if (typeName === "[object Object]") {
        typeName = "null";
      }
      var methodName = this.getMethodName();
      if (functionName) {
        if (typeName && functionName.indexOf(typeName) != 0) {
          line += typeName + ".";
        }
        line += functionName;
        if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
          line += " [as " + methodName + "]";
        }
      } else {
        line += typeName + "." + (methodName || "<anonymous>");
      }
    } else if (isConstructor) {
      line += "new " + (functionName || "<anonymous>");
    } else if (functionName) {
      line += functionName;
    } else {
      line += fileLocation;
      addSuffix = false;
    }
    if (addSuffix) {
      line += " (" + fileLocation + ")";
    }
    return line;
  }
  function cloneCallSite(frame) {
    var object = {};
    Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
      object[name] = /^(?:is|get)/.test(name) ? function() {
        return frame[name].call(frame);
      } : frame[name];
    });
    object.toString = CallSiteToString;
    return object;
  }
  function wrapCallSite(frame) {
    if (frame.isNative()) {
      return frame;
    }
    var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
    if (source) {
      var line = frame.getLineNumber();
      var column = frame.getColumnNumber() - 1;
      var headerLength = 62;
      if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
        column -= headerLength;
      }
      var position = mapSourcePosition({
        source: source,
        line: line,
        column: column
      });
      frame = cloneCallSite(frame);
      frame.getFileName = function() {
        return position.source;
      };
      frame.getLineNumber = function() {
        return position.line;
      };
      frame.getColumnNumber = function() {
        return position.column + 1;
      };
      frame.getScriptNameOrSourceURL = function() {
        return position.source;
      };
      return frame;
    }
    var origin = frame.isEval() && frame.getEvalOrigin();
    if (origin) {
      origin = mapEvalOrigin(origin);
      frame = cloneCallSite(frame);
      frame.getEvalOrigin = function() {
        return origin;
      };
      return frame;
    }
    return frame;
  }
  function prepareStackTrace(error, stack) {
    if (emptyCacheBetweenOperations) {
      fileContentsCache = {};
      sourceMapCache = {};
    }
    return error + stack.map(function(frame) {
      return '\n    at ' + wrapCallSite(frame);
    }).join('');
  }
  function getErrorSource(error) {
    var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
    if (match) {
      var source = match[1];
      var line = +match[2];
      var column = +match[3];
      var contents = fileContentsCache[source];
      if (!contents && fs && fs.existsSync(source)) {
        try {
          contents = fs.readFileSync(source, 'utf8');
        } catch (er) {
          contents = '';
        }
      }
      if (contents) {
        var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
        if (code) {
          return source + ':' + line + '\n' + code + '\n' + new Array(column).join(' ') + '^';
        }
      }
    }
    return null;
  }
  function printErrorAndExit(error) {
    var source = getErrorSource(error);
    if (source) {
      console.error();
      console.error(source);
    }
    console.error(error.stack);
    process.exit(1);
  }
  function shimEmitUncaughtException() {
    var origEmit = process.emit;
    process.emit = function(type) {
      if (type === 'uncaughtException') {
        var hasStack = (arguments[1] && arguments[1].stack);
        var hasListeners = (this.listeners(type).length > 0);
        if (hasStack && !hasListeners) {
          return printErrorAndExit(arguments[1]);
        }
      }
      return origEmit.apply(this, arguments);
    };
  }
  exports.wrapCallSite = wrapCallSite;
  exports.getErrorSource = getErrorSource;
  exports.mapSourcePosition = mapSourcePosition;
  exports.retrieveSourceMap = retrieveSourceMap;
  exports.install = function(options) {
    options = options || {};
    if (options.environment) {
      environment = options.environment;
      if (["node", "browser", "auto"].indexOf(environment) === -1) {
        throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}");
      }
    }
    if (options.retrieveFile) {
      if (options.overrideRetrieveFile) {
        retrieveFileHandlers.length = 0;
      }
      retrieveFileHandlers.unshift(options.retrieveFile);
    }
    if (options.retrieveSourceMap) {
      if (options.overrideRetrieveSourceMap) {
        retrieveMapHandlers.length = 0;
      }
      retrieveMapHandlers.unshift(options.retrieveSourceMap);
    }
    if (options.hookRequire && !isInBrowser()) {
      var Module;
      try {
        Module = require('module');
      } catch (err) {}
      var $compile = Module.prototype._compile;
      if (!$compile.__sourceMapSupport) {
        Module.prototype._compile = function(content, filename) {
          fileContentsCache[filename] = content;
          sourceMapCache[filename] = undefined;
          return $compile.call(this, content, filename);
        };
        Module.prototype._compile.__sourceMapSupport = true;
      }
    }
    if (!emptyCacheBetweenOperations) {
      emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ? options.emptyCacheBetweenOperations : false;
    }
    if (!errorFormatterInstalled) {
      errorFormatterInstalled = true;
      Error.prepareStackTrace = prepareStackTrace;
    }
    if (!uncaughtShimInstalled) {
      var installHandler = 'handleUncaughtExceptions' in options ? options.handleUncaughtExceptions : true;
      if (installHandler && hasGlobalProcessEventEmitter()) {
        uncaughtShimInstalled = true;
        shimEmitUncaughtException();
      }
    }
  };
})(require('buffer').Buffer, require('process'));
