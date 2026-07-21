/**
 * Frontend logger — respects VITE_LOG_LEVEL env var.
 * Defaults to 'warn' in production, 'debug' in development.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 } as const;
type Level = keyof typeof LEVELS;

const envLevel = (import.meta.env.VITE_LOG_LEVEL || (import.meta.env.PROD ? 'warn' : 'debug')).toLowerCase() as Level;
const minLevel = LEVELS[envLevel] ?? LEVELS.info;

export function createLogger(module: string) {
  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (minLevel <= LEVELS.debug) console.debug(`[${module}] ${msg}`, ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
      if (minLevel <= LEVELS.info) console.info(`[${module}] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
      if (minLevel <= LEVELS.warn) console.warn(`[${module}] ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      if (minLevel <= LEVELS.error) console.error(`[${module}] ${msg}`, ...args);
    },
  };
}
