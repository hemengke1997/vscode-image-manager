import type { ReactNode } from 'react'
import { memo } from 'react'

function TitleIconUI(props: { children: ReactNode, icon: ReactNode }) {
  const { icon, children } = props
  return (
    <div className='flex items-center gap-x-1'>
      <div className='flex items-center text-xl'>{icon}</div>
      <span>{children}</span>
    </div>
  )
}

export default memo(TitleIconUI)
