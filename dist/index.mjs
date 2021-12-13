// src/index.ts
import {resolve, relative} from "path";
import {green, dim} from "chalk";
import picomatch from "picomatch";
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
    const files = Array.from(paths).map((path) => resolve(root, path));
    const shouldReload = picomatch(files);
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
          logger.info(`${green("page reload")} ${dim(relative(root, path))}`, {clear: true, timestamp: true});
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
export {
  src_default as default
};
