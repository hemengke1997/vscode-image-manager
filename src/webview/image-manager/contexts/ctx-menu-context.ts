import { useState } from 'react'
import { createContainer } from 'context-state'

function useCtxMenuContext() {
  // 是否显示快捷键
  const [shortcutsVisible, setShortCutsVisible] = useState(true)

  return {
    shortcutsVisible,
    setShortCutsVisible,
  }
}

const CtxMenuContext = createContainer(useCtxMenuContext)

export default CtxMenuContext
