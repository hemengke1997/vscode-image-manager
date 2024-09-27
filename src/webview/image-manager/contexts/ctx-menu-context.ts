import { useState } from 'react'
import { createContainer } from 'context-state'

function useCtxMenuContext() {
  const [shortcutsVisible, setShortCutsVisible] = useState(true)

  return {
    shortcutsVisible,
    setShortCutsVisible,
  }
}

const CtxMenuContext = createContainer(useCtxMenuContext)

export default CtxMenuContext
