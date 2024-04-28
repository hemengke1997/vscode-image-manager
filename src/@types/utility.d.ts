type Option = {
  label: string
  value: string
  [k in string]: any
}

type ValueOf<T> = T[keyof T]

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RmPromise<T> = T extends Promise<infer U> ? U : T

type AnyObject = Record<PropertyKey, any>

/**
 * 扁平化对象类型
 * @example ```ts
 * type A = { a: 1, b: { c: 2 } };
 * type B = Flatten<A>; // "a" | "b.c"
 * type C = Flatten<A, true>; // "a" | "b" | "b.c"
 * ```
 */
type Flatten<T, IncludeParents extends boolean = false> = Exclude<
  {
    [K in keyof T]: T[K] extends object
      ?
          | (IncludeParents extends true ? K : never)
          | { [P in keyof T[K]]: `${string & K}.${P}` extends infer R ? `${R}` : never }[keyof T[K]]
      : K
  }[keyof T],
  undefined
>
