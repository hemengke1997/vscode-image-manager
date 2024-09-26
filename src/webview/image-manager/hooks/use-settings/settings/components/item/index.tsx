import { memo, type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useSize } from 'ahooks'
import { produce } from 'immer'
import { max } from 'lodash-es'
import { classNames } from 'tw-clsx'

export function useLabelWidth() {
  const [labels, setLabels] = useState<Record<string, number>>({})

  const onResize = useMemoizedFn((labelKey: string, width: number | undefined) => {
    if (!width) {
      return
    } else {
      setLabels(
        produce((draft) => {
          draft[labelKey] = width
        }),
      )
    }
  })

  const maxWidth = max(Object.values(labels)) || 0

  return [maxWidth, onResize] as const
}

function Item(props: {
  label: ReactNode
  children: ReactNode
  minWidth: number
  onResize: (labelKey: string, width: number | undefined) => void
  labelKey: string
}) {
  const { label, children, minWidth, onResize, labelKey } = props

  const labelRef = useRef<HTMLDivElement>(null)
  const { width } = useSize(labelRef) || {}

  useLayoutEffect(() => {
    onResize(labelKey, width)
  }, [width])

  return (
    <>
      <div className={classNames('fixed left-[-9999px] top-[-9999px] text-lg font-medium')} ref={labelRef}>
        {label}
      </div>
      <div className={'flex items-center gap-x-8'}>
        <div
          className={classNames('flex-none text-lg font-medium transition-all')}
          style={{
            minWidth,
          }}
        >
          {label}
        </div>
        <div>{children}</div>
      </div>
    </>
  )
}

export default memo(Item)
