export enum Env {
  development = 'development',
  test = 'test',
  production = 'production',
}

export function isDev(): boolean {
  return import.meta.env.MODE === Env.development
}

export function isTest(): boolean {
  return import.meta.env.MODE === Env.test
}

export function isProd(): boolean {
  return import.meta.env.MODE === Env.production
}
