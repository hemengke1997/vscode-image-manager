import { memo, useEffect } from 'react'

type PlaceholderProps = {
  onMount: () => void
  onUnMount: () => void
}

function Placeholder(props: PlaceholderProps) {
  const { onMount, onUnMount } = props

  useEffect(() => {
    onMount()
    return () => {
      onUnMount()
    }
  }, [])

  return null
}

export default memo(Placeholder)
