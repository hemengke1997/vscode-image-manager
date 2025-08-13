import { FloatButton } from 'antd'
import { useAtom } from 'jotai'
import { memo } from 'react'
import { LuRefreshCcwDot } from 'react-icons/lu'
import { VscDebug, VscDebugConsole } from 'react-icons/vsc'
import { DebugAtoms } from '../../stores/debug/debug-store'
import { isDev } from '../../utils/env'

function Debug() {
  const [isDebugMode, setIsDebugMode] = useAtom(DebugAtoms.isDebugModeAtom)

  if (isDev()) {
    return (
      <>
        <FloatButton.Group
          trigger='click'
          icon={<VscDebug />}
          className='end-auto start-8'
        >
          <FloatButton
            icon={<LuRefreshCcwDot />}
            onClick={() => {
              window.mountApp(true)
            }}
            tooltip='Reload'
          />
          <FloatButton
            icon={<VscDebugConsole />}
            type={isDebugMode ? 'primary' : 'default'}
            onClick={() => {
              setIsDebugMode(!isDebugMode)
            }}
            tooltip={`${isDebugMode ? 'Disable' : 'Enable'} Debug Mode`}
          />
        </FloatButton.Group>
      </>
    )
  }

  return null
}

export default memo(Debug)
