import { PluginOption } from 'vite';

/**
 * Configuration for the watched paths.
 */
interface Config {
    /**
     * Whether full reload should happen regardless of the file path.
     * @default true
     */
    always?: boolean;
    /**
     * How many milliseconds to wait before reloading the page after a file change.
     * @default 0
     */
    delay?: number;
    /**
     * Whether to log when a file change triggers a full reload.
     * @default true
     */
    log?: boolean;
    /**
     * Files will be resolved against this path.
     * @default process.cwd()
     */
    root?: string;
    /**
     * Use a custom handler to reload the page (like Turbo)
     */
    custom?: boolean;
}
declare const _default: (paths: string | string[], config?: Config) => PluginOption;

export default _default;
