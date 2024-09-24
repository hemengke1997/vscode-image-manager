import { useEffect, useRef } from 'react'
import { useUpdate } from 'ahooks'

type Props = {
  onChanage?: () => void
}

export default function useScrollRef(props?: Props) {
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
