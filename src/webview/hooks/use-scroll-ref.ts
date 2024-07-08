import { useUpdate } from '@minko-fe/react-hook'
import { useEffect, useRef } from 'react'

export function useScrollRef() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const update = useUpdate()
  useEffect(() => {
    if (scrollRef.current) {
      update()
    }
  }, [scrollRef])

  return { scrollRef }
}
