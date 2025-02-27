import { resolve, relative } from 'path'
import { green, dim } from 'chalk'
import picomatch from 'picomatch'
import type { PluginOption, ViteDevServer } from 'vite'

/**
 * Configuration for the watched paths.
 */
interface Config {
  /**
   * Whether full reload should happen regardless of the file path.
   * @default true
   */
  always?: boolean

  /**
   * How many milliseconds to wait before reloading the page after a file change.
   * @default 0
   */
  delay?: number

  /**
   * Whether to log when a file change triggers a full reload.
   * @default true
   */
  log?: boolean

  /**
   * Files will be resolved against this path.
   * @default process.cwd()
   */
  root?: string

  /**
   * Use a custom handler to reload the page (like Turbo)
   */
  custom?: boolean
}

/**
 * Included integrations to popular third-party libraries
 */
const includedCustomHandlers = new Map<string, string>()
includedCustomHandlers.set('turbo', 'Turbo.clearCache(); Turbo.visit(location.href, { action: "replace" })')

/**
 * Allows to automatically reload the page when a watched file changes.
 */
export default (paths: string | string[], config: Config = {}): PluginOption => ({
  name: 'vite-plugin-full-reload',

  // NOTE: Enable globbing so that Vite keeps track of the template files.
  config: () => ({ server: { watch: { disableGlobbing: false } } }),

  configureServer ({ watcher, ws, config: { logger } }: ViteDevServer) {
    const {
      root = process.cwd(),
      log = true,
      always = true,
      delay = 0,
      custom = false,
    } = config

    const files = Array.from(paths).map(path => resolve(root, path))
    const shouldReload = picomatch(files)
    const reload = (path: string) => {
      if (custom)
        ws.send({ type: 'custom', event: 'full-reload', data: { path } })
      else
        ws.send({ type: 'full-reload', path })
    }
    const checkReload = (path: string) => {
      if (shouldReload(path)) {
        setTimeout(() => reload(always ? '*' : path), delay)
        if (log)
          logger.info(`${green('page reload')} ${dim(relative(root, path))}`, { clear: true, timestamp: true })
      }
    }

    // Ensure Vite keeps track of the files and triggers HMR as needed.
    watcher.add(files)

    // Do a full page reload if any of the watched files changes.
    watcher.on('add', checkReload)
    watcher.on('change', checkReload)
  },

  resolveId: (id: string) => {
    const key = id.replace('virtual:full-reload/', '')
    if (includedCustomHandlers.has(key))
      return id
  },
  load: (id: string) => {
    const key = id.replace('virtual:full-reload/', '')
    if (includedCustomHandlers.has(key)) {
      return `if (import.meta.hot) {
        import.meta.hot.on('full-reload', (data) => {
          ${includedCustomHandlers.get(key)}
        })
      }`
    }
  },
})
