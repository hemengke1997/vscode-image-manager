import { useUpdate } from '@minko-fe/react-hook'
import { useEffect, useRef } from 'react'

type Props = {
  onChanage?: () => void
}

export function useScrollRef(props?: Props) {
  const { onChanage } = props || {}

  const scrollRef = useRef<HTMLDivElement>(null)

  const update = useUpdate()
  useEffect(() => {
    if (scrollRef.current) {
      onChanage?.()
      update()
    }
  }, [scrollRef])

  return { scrollRef }
}
