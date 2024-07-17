import { type ReactElement } from 'react'
import { render as ReactRender, unmount as ReactUnmount } from './render'

const destroyFns: Array<() => void> = []

type ConfigUpdate<T = any> = Partial<T> | ((prev: T) => Partial<T>)

type Config<T = any> = {
  /**
   * @description 声明式组件
   */
  RC: React.FC<T>
  /**
   * @description imperative 使用到的组件关键key
   * 遵循antd modal规范
   */
  keys?: {
    /**
     * 显隐 key
     */
    open?: string

    /**
     * 关闭回调 key
     */
    onCancel?: string
    /**
     * 完全关闭后回调 key
     */
    afterClose?: string
  }
  /**
   * @description 组件的runtime props
   * visible 可选
   */
  props: T
  /**
   * 包裹RC的外层组件
   * @param children RC
   */
  wrapper?: (children: ReactElement) => ReactElement
}

type ImperativeReturnType<T> = {
  destroy: () => void
  update: (configUpdate: ConfigUpdate<T>) => void
  then: <T>(resolve?: (value: ResolvePromiseValue) => T, reject?: VoidFunction) => Promise<T>
}

type ResolvePromiseValue = {
  canceled: boolean
}

/**
 * @description 把声明式组件转换为命令式
 *
 * 如 antd 的 Modal
 *
 * 如 vant 的 Dialog
 */
function imperative<T>(config: Config<T>): ImperativeReturnType<T> {
  const { RC, keys, props, wrapper = (children) => children } = config

  const {
    open: openKey = 'open',
    afterClose: afterCloseKey = 'afterClose',
    onCancel: onCancelKey = 'onCancel',
  } = keys || {}

  const container = document.createDocumentFragment()

  let currentProps = { ...props, [onCancelKey]: close, [openKey]: true } as any
  let resolvePromise: (value: ResolvePromiseValue) => void
  const promise = new Promise<ResolvePromiseValue>((resolve) => {
    resolvePromise = resolve
  })
  let timeoutId: ReturnType<typeof setTimeout>

  function destroy() {
    for (let i = 0; i < destroyFns.length; i++) {
      const fn = destroyFns[i]
      if (fn === close) {
        destroyFns.splice(i, 1)
        break
      }
    }
    ReactUnmount(container)
  }

  function render(props: any) {
    clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      ReactRender(wrapper?.(<RC {...props} />), container)
    })
  }

  function close(...args: any[]) {
    currentProps = {
      ...currentProps,
      [openKey]: false,
      [afterCloseKey]: () => {
        if (typeof props[afterCloseKey] === 'function') {
          ;(props[afterCloseKey] as Function)()
        }
        // @ts-expect-error
        destroy.apply(this, args)
      },
    }
    resolvePromise({
      canceled: true,
    })
    render(currentProps)
  }

  function update(configUpdate: ConfigUpdate<T>) {
    if (typeof configUpdate === 'function') {
      currentProps = configUpdate(currentProps)
    } else {
      currentProps = {
        ...currentProps,
        ...configUpdate,
      }
    }
    render(currentProps)
  }

  render(currentProps)

  destroyFns.push(close)

  return {
    destroy: close,
    update,
    then: (resolve) => {
      return promise.then(resolve)
    },
  }
}

export { imperative }
