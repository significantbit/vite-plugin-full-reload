"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// src/index.ts
var _path = require('path');
var _chalk = require('chalk');
var _picomatch = require('picomatch'); var _picomatch2 = _interopRequireDefault(_picomatch);
var includedCustomHandlers = new Map();
includedCustomHandlers.set("turbo", 'Turbo.clearCache(); Turbo.visit(location.href, { action: "replace" })');
var src_default = (paths, config = {}) => ({
  name: "vite-plugin-full-reload",
  config: () => ({server: {watch: {disableGlobbing: false}}}),
  configureServer({watcher, ws, config: {logger}}) {
    const {
      root = process.cwd(),
      log = true,
      always = true,
      delay = 0,
      custom = false
    } = config;
    const files = Array.from(paths).map((path) => _path.resolve.call(void 0, root, path));
    const shouldReload = _picomatch2.default.call(void 0, files);
    const reload = (path) => {
      if (custom)
        ws.send({type: "custom", event: "full-reload", data: {path}});
      else
        ws.send({type: "full-reload", path});
    };
    const checkReload = (path) => {
      if (shouldReload(path)) {
        setTimeout(() => reload(always ? "*" : path), delay);
        if (log)
          logger.info(`${_chalk.green.call(void 0, "page reload")} ${_chalk.dim.call(void 0, _path.relative.call(void 0, root, path))}`, {clear: true, timestamp: true});
      }
    };
    watcher.add(files);
    watcher.on("add", checkReload);
    watcher.on("change", checkReload);
  },
  resolveId: (id) => {
    const key = id.replace("virtual:full-reload/", "");
    if (includedCustomHandlers.has(key))
      return id;
  },
  load: (id) => {
    const key = id.replace("virtual:full-reload/", "");
    if (includedCustomHandlers.has(key)) {
      return `if (import.meta.hot) {
        import.meta.hot.on('full-reload', (data) => {
          ${includedCustomHandlers.get(key)}
        })
      }`;
    }
  }
});


exports.default = src_default;
