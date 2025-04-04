type Option = {
  label: string
  value: string
  [k in string]: any
}

type ValueOf<T> = T[keyof T]

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type FirstParameter<F> = F extends (arg: infer A, ...args: any) => any ? A : never

type AnyObject = Record<PropertyKey, any>

/**
 * 扁平化对象类型
 * @example ```ts
 * type A = { a: 1, b: { c: 2, d: { e: 3 } } };
 * type B = Flatten<A>; // "a" | "b.c" | "b.d.e"
 * type C = Flatten<A, true>; // "a" | "b" | "b.c" | "b.d" | "b.d.e"
 * ```
 */
type Flatten<T> = keyof FlattenObject<T>

// see https://blog.swmansion.com/deep-flatten-typescript-type-c0d123028d82
// Flatten entity
type FlattenObject<TValue> = CollapseEntries<CreateObjectEntries<TValue, TValue>>

type Entry = { key: string; value: unknown }
type EmptyEntry<TValue> = { key: ''; value: TValue }
type ExcludedTypes = Date | Set<unknown> | Map<unknown, unknown>
type ArrayEncoder = `[${bigint}]`

type EscapeArrayKey<TKey extends string> = TKey extends `${infer TKeyBefore}.${ArrayEncoder}${infer TKeyAfter}`
  ? EscapeArrayKey<`${TKeyBefore}${ArrayEncoder}${TKeyAfter}`>
  : TKey

// Transforms entries to one flattened type
type CollapseEntries<TEntry extends Entry> = {
  [E in TEntry as EscapeArrayKey<E['key']>]: E['value']
}

// Transforms array type to object
type CreateArrayEntry<TValue, TValueInitial> = OmitItself<
  TValue extends unknown[] ? { [k: ArrayEncoder]: TValue[number] } : TValue,
  TValueInitial
>

// Omit the type that references itself
type OmitItself<TValue, TValueInitial> = TValue extends TValueInitial
  ? EmptyEntry<TValue>
  : OmitExcludedTypes<TValue, TValueInitial>

// Omit the type that is listed in ExcludedTypes union
type OmitExcludedTypes<TValue, TValueInitial> = TValue extends ExcludedTypes
  ? EmptyEntry<TValue>
  : CreateObjectEntries<TValue, TValueInitial>

type CreateObjectEntries<TValue, TValueInitial> = TValue extends object
  ? {
      // Checks that Key is of type string
      [TKey in keyof TValue]-?: TKey extends string
        ? // Nested key can be an object, run recursively to the bottom
          CreateArrayEntry<TValue[TKey], TValueInitial> extends infer TNestedValue
          ? TNestedValue extends Entry
            ? TNestedValue['key'] extends ''
              ? {
                  key: TKey
                  value: TNestedValue['value']
                }
              :
                  | {
                      key: `${TKey}.${TNestedValue['key']}`
                      value: TNestedValue['value']
                    }
                  | {
                      key: TKey
                      value: TValue[TKey]
                    }
            : never
          : never
        : never
    }[keyof TValue] // Builds entry for each key
  : EmptyEntry<TValue>
