import { useState } from 'react'
import { createContainer } from 'context-state'

/**
 * 右键菜单上下文
 * 支持 react-contexify 不满足的功能
 */
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
