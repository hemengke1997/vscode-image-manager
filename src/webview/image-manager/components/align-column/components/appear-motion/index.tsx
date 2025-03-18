import { memo, type PropsWithChildren } from 'react'
import { Transition } from 'react-transition-preset'

function AppearMotion(props: PropsWithChildren) {
  const { children } = props

  return (
    <Transition mounted={true} initial={true}>
      {(style) => (
        <div style={style} className={'flex flex-col gap-4'}>
          {children}
        </div>
      )}
    </Transition>
  )
}

export default memo(AppearMotion)
