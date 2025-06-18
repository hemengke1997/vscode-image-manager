import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * tw merged classnames
 */
export function classNames(...args: ClassValue[]) {
  return twMerge(clsx(args))
}
