/**
 * Minimal logger — respects LOG_LEVEL env var.
 * Levels: debug < info < warn < error
 * Default: 'info' (suppresses debug/console.log noise in production)
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 } as const;
type Level = keyof typeof LEVELS;

const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as Level;
const minLevel = LEVELS[envLevel] ?? LEVELS.info;

function fmt(level: string, module: string, msg: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${module}]`;
  if (data !== undefined) {
    return `${prefix} ${msg} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${msg}`;
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => {
      if (minLevel <= LEVELS.debug) console.log(fmt('debug', module, msg, data));
    },
    info: (msg: string, data?: unknown) => {
      if (minLevel <= LEVELS.info) console.log(fmt('info', module, msg, data));
    },
    warn: (msg: string, data?: unknown) => {
      if (minLevel <= LEVELS.warn) console.warn(fmt('warn', module, msg, data));
    },
    error: (msg: string, data?: unknown) => {
      if (minLevel <= LEVELS.error) console.error(fmt('error', module, msg, data));
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
