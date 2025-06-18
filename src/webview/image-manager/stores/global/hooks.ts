import { useMemoizedFn } from 'ahooks'
import { floor } from 'es-toolkit/compat'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { ConfigKey } from '~/core/config/common'
import { useExtConfigState } from '../../hooks/use-ext-config-state'
import { VscodeAtoms } from '../vscode/vscode-store'

/**
 * 图片宽度
 */
export function useImageWidth() {
  const _imageWidth = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.viewer.imageWidth),
    ),
  )
  const [imageWidth, setImageWidth] = useExtConfigState(ConfigKey.viewer_imageWidth, _imageWidth, [], {
    debounce: {
      wait: 500,
    },
    // 向下取整，避免出现小数，也为了保证图片不换行
    postValue: value => floor(value, 0),
  })
  return [imageWidth, setImageWidth] as const
}
