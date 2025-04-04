import { useReducer, useRef, useState } from 'react'
import { createStore } from 'context-state'
import { groupBy, remove } from 'es-toolkit'
import { find, floor } from 'es-toolkit/compat'
import { produce } from 'immer'
import { ConfigKey } from '~/core/config/common'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { type FormatConverterOptions } from '~/core/operator/format-converter'
import { type FullUpdate, type PatchUpdate } from '~/message/webview-message-factory'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import VscodeStore from '~/webview/image-manager/stores/vscode-store'
import { UpdateEvent, UpdateOrigin, UpdateType } from '../utils/tree/const'
import { type UpdatePayload } from '../utils/tree/tree-manager'

export type WebviewCompressorType = {
  option: CompressionOptions
  limit: {
    from: string[]
    to: string[]
  }
}

export type Workspace = {
  images: ImageType[] // 图片
  workspaceFolder: string // 工作区名称
  absWorkspaceFolder: string // 工作区绝对路径
  update:
    | {
        payloads: UpdatePayload[] // 更新的图片
        type: UpdateType // 更新类型，全量更新/增量更新
      }
    | undefined
}

export type WebviewFormatConverterType = {
  option: FormatConverterOptions
  limit: {
    from: string[]
    to: string[]
  }
}

function useGlobalStore() {
  const { extConfig, workspaceState, vscodeConfig } = VscodeStore.useStore([
    'extConfig',
    'workspaceState',
    'vscodeConfig',
  ])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<WebviewCompressorType>()
  /* ---------- image format converter ---------- */
  const [formatConverter, setFormatConverter] = useState<WebviewFormatConverterType>()

  /* --------------- images state --------------- */
  const updateId = useRef<string>()
  const [imageState, dispatchImageState] = useReducer(
    (
      state: {
        loading: boolean
        workspaces: Workspace[]
      },
      action:
        | FullUpdate
        | PatchUpdate
        | {
            updateType: 'reset'
          },
    ) => {
      if (action.updateType === 'reset') {
        state = produce(state, (draft) => {
          draft.workspaces.forEach((workspace) => {
            workspace.update = undefined
          })
        })
      } else {
        if (action.updateType === UpdateType.full) {
          state = produce(state, (draft) => {
            const imagePayloads = action.payloads.filter((item) => item.origin === UpdateOrigin.image)
            const images = imagePayloads.map((item) => item.data.payload)

            const index = draft.workspaces.findIndex((t) => t.workspaceFolder === action.workspaceFolder)

            if (index !== -1) {
              draft.workspaces[index].images = images
            } else {
              draft.workspaces.push({
                workspaceFolder: action.workspaceFolder,
                absWorkspaceFolder: action.absWorkspaceFolder,
                images,
                update: {
                  payloads: [],
                  type: UpdateType.full,
                },
              })
            }

            updateId.current = action.id

            draft.workspaces.forEach((workspace) => {
              workspace.update = {
                payloads: [],
                type: UpdateType.full,
              }
            })
          })
        } else if (action.updateType === UpdateType.patch) {
          // payload按照工作区分组
          const groupedPayload = groupBy(action.payloads, (item) => item.data.payload.workspaceFolder)
          state = produce(state, (draft) => {
            Object.entries(groupedPayload).forEach(([workspaceFolder, payloads]) => {
              const workspace = find(draft.workspaces, { workspaceFolder })
              if (!workspace) return

              workspace.update = {
                payloads,
                type: UpdateType.patch,
              }

              payloads
                .filter((t) => t.origin === UpdateOrigin.image)
                .forEach((item) => {
                  const { type, payload } = item.data

                  switch (type) {
                    case UpdateEvent.create: {
                      workspace.images.push(payload)
                      break
                    }

                    case UpdateEvent.update: {
                      const image = find(workspace.images, { path: payload.path })
                      if (image) {
                        Object.assign(image, payload)
                      }
                      break
                    }

                    case UpdateEvent.delete: {
                      remove(workspace.images, (image) => image.path === payload.path)
                      break
                    }

                    default:
                      break
                  }
                })

              payloads
                .filter((t) => t.origin === UpdateOrigin.dir)
                .forEach((item) => {
                  const { type, payload } = item.data

                  switch (type) {
                    case UpdateEvent.delete: {
                      remove(workspace.images, (image) => image.absDirPath === payload.absDirPath)
                      break
                    }

                    default:
                      break
                  }
                })
            })
          })
        }
      }

      return {
        ...state,
        loading: false,
      }
    },
    {
      loading: true,
      workspaces: [],
    },
  )

  /* ---------------- image width --------------- */
  const [imageWidth, setImageWidth] = useExtConfigState(ConfigKey.viewer_imageWidth, extConfig.viewer.imageWidth, [], {
    debounce: {
      wait: 500,
    },
    // 向下取整，避免出现小数，也为了保证图片不换行
    postValue: (value) => floor(value, 0),
  })

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  /* ---------- reveal image path ---------- */
  /**
   * @note imageReveal 是带t query参数的，用于处理同一张图片的情况
   */
  const [imageReveal, setImageReveal] = useState<string[]>([window.__reveal_image_path__])

  /**
   * sharp安装成功
   */
  const [sharpInstalled] = useState<boolean>(window.__sharp_installed__)

  /* ----------------- dir reveal ----------------- */
  const [dirReveal, setDirReveal] = useState<string>('')

  /* ------------- 工作区中可见图片列表 ------------ */
  const [workspaceImages, setWorkspaceImages] = useState<{ workspaceFolder: string; images: ImageType[] }[]>([])

  /* ------------ 图片sticky header的高度 ------------ */
  const [viewerHeaderStickyHeight, setViewerHeaderStickyHeight] = useState<number>(0)

  /* ------------------ 插件最新信息 ------------------ */
  const [extLastetInfo, setExtLastetInfo] = useState<{ version: string; author: string } | null>(null)

  return {
    vscodeConfig,
    workspaceState,
    compressor,
    setCompressor,
    formatConverter,
    setFormatConverter,
    extConfig,
    imageState,
    dispatchImageState,
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
    imageReveal,
    setImageReveal,
    workspaceImages,
    setWorkspaceImages,
    viewerHeaderStickyHeight,
    setViewerHeaderStickyHeight,
    dirReveal,
    setDirReveal,
    sharpInstalled,
    extLastetInfo,
    setExtLastetInfo,
  }
}

const GlobalStore = createStore(useGlobalStore)

export default GlobalStore
