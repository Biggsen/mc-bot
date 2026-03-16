const PREFIX = "[mc-bot]";

export function log(message: string, ...args: unknown[]): void {
  console.log(`${PREFIX} ${message}`, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  console.error(`${PREFIX} ${message}`, ...args);
}
