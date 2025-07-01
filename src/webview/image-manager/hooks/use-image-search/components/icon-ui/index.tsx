import type { HTMLAttributes } from 'react'
import { memo } from 'react'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'

function IconUI(
  props: {
    active: boolean
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { active, className, ...rest } = props
  return (
    <div
      className={classNames(
        'flex h-full cursor-pointer select-none items-center rounded-md border-solid border-transparent p-0.5 text-lg transition-all hover:bg-ant-color-bg-text-hover',
        active && '!border-ant-color-primary !text-ant-color-primary hover:bg-transparent',
        className,
      )}
      {...rest}
    >
      {props.children}
    </div>
  )
}

export default memo(IconUI)
