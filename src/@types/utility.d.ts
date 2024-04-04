type Option = {
  label: string
  value: string
  [k in string]: any
}

type ValueOf<T> = T[keyof T]

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RmPromise<T> = T extends Promise<infer U> ? U : T

type FlattenIfObject<T, K extends keyof T> = T[K] extends (infer R)[]
  ? K
  : T[K] extends object
    ? `${K}.${ObjectKeys<T[K]>}` | K
    : K

type ObjectKeys<T> = {
  [K in keyof T]: FlattenIfObject<T, K>
}[keyof T]

type AnyObject = Record<PropertyKey, any>
