import { useMemoizedFn, useSize } from 'ahooks'
import { max } from 'es-toolkit/compat'
import { produce } from 'immer'
import { memo, type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'

// eslint-disable-next-line react-refresh/only-export-components
export function useColumnWidth() {
  const [cols, setCols] = useState<Record<string, number>>({})

  const onResize = useMemoizedFn((labelKey: string, width: number | undefined) => {
    if (width) {
      setCols(
        produce((draft) => {
          draft[labelKey] = width
        }),
      )
    }
  })

  const maxWidth = max(Object.values(cols)) || 0

  return [maxWidth, onResize] as const
}

function AlignColumn(props: {
  left: ReactNode
  right: ReactNode
  minWidth: number
  onResize: (id: string, width: number | undefined) => void
  id: string
}) {
  const { left, right, minWidth, onResize, id } = props

  const leftRef = useRef<HTMLDivElement>(null)
  const { width } = useSize(leftRef) || {}

  useLayoutEffect(() => {
    onResize(id, width)
  }, [width])

  return (
    <>
      <div className={classNames('fixed left-[-9999px] top-[-9999px] text-lg font-medium')} ref={leftRef}>
        {left}
      </div>
      <div className='flex items-center gap-x-8'>
        <div
          className={classNames('flex-none text-lg font-medium')}
          style={{
            minWidth,
          }}
        >
          {left}
        </div>
        <div className='flex-1'>{right}</div>
      </div>
    </>
  )
}

export default memo(AlignColumn)
