import type { IProps } from 'ahooks/lib/useWhyDidYouUpdate'
import type useWhyDidYouUpdate from 'ahooks/lib/useWhyDidYouUpdate'
import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'
import logger from '~/utils/logger'
import { DebugAtoms } from '../stores/debug/debug-store'

export const useWhyUpdateDebug: typeof useWhyDidYouUpdate = (componentName, props) => {
  const prevProps = useRef<IProps>({})

  const isDebugMode = useAtomValue(DebugAtoms.isDebugModeAtom)

  useEffect(() => {
    if (!isDebugMode)
      return

    if (prevProps.current) {
      const allKeys = Object.keys({ ...prevProps.current, ...props })
      const changedProps: IProps = {}

      allKeys.forEach((key) => {
        if (!Object.is(prevProps.current[key], props[key])) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key],
          }
        }
      })

      if (Object.keys(changedProps).length) {
        logger.debug('[why-did-you-update]', componentName, changedProps)
      }
    }

    prevProps.current = props
  })
}
