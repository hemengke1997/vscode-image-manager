import { memo, type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useSize } from 'ahooks'
import { produce } from 'immer'
import { max } from 'lodash-es'
import { classNames } from 'tw-clsx'

export function useColumnWidth() {
  const [cols, setCols] = useState<Record<string, number>>({})

  const onResize = useMemoizedFn((labelKey: string, width: number | undefined) => {
    if (!width) {
      return
    } else {
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
      <div className={'flex items-center gap-x-8'}>
        <div
          className={classNames('flex-none text-lg font-medium')}
          style={{
            minWidth,
          }}
        >
          {left}
        </div>
        <div>{right}</div>
      </div>
    </>
  )
}

export default memo(AlignColumn)
