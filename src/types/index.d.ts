type ValueOf<T> = T[keyof T]

type MakeRequired<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
