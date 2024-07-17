import { type ReactElement } from 'react'
import { type Root, createRoot } from 'react-dom/client'

// 移植自rc-util: https://github.com/react-component/util/blob/master/src/React/render.ts

const MARK = '__react_imperative_root__'

// ========================== Render ==========================
type ContainerType = (Element | DocumentFragment) & {
  [MARK]?: Root
}

function concurrentRender(node: ReactElement, container: ContainerType) {
  const root = container[MARK] || createRoot(container)
  root.render(node)
  container[MARK] = root
}

export function render(node: ReactElement, container: ContainerType) {
  concurrentRender(node, container)
}

// ========================== Unmount =========================
async function concurrentUnmount(container: ContainerType) {
  // Delay to unmount to avoid React 18 sync warning
  return Promise.resolve().then(() => {
    container[MARK]?.unmount()
    delete container[MARK]
  })
}

export function unmount(container: ContainerType) {
  return concurrentUnmount(container)
}
