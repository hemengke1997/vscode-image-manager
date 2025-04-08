import { startTransition, useEffect, useReducer, useState } from 'react'
import { useDebounceEffect, useMemoizedFn } from 'ahooks'
import { createStore } from 'context-state'
import { groupBy, remove, uniq } from 'es-toolkit'
import { find } from 'es-toolkit/compat'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import { CmdToVscode } from '~/message/cmd'
import { type FullUpdate, type PatchUpdate } from '~/message/webview-message-factory'
import { abortPromise } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import { UpdateEvent, UpdateOrigin, UpdateType } from '../utils/tree/const'
import { type UpdatePayload } from '../utils/tree/tree-manager'

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

function useImageStore() {
  /* --------------- images state --------------- */
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
                      // 清除payload的目录以及子目录下的图片
                      remove(workspace.images, (image) => image.absDirPath.startsWith(payload.absDirPath))
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

  /* --------- 请求图片metadata/gitStaged的队列 -------- */
  const [imageInfoQueue, setImageInfoQueue] = useState<{
    images: ImageType[]
    abortController: AbortController
  }>({
    images: [],
    abortController: new AbortController(),
  })

  const queryImagesInfo = useMemoizedFn((images: ImageType[]) => {
    logger.time('queryImagesInfo')
    return new Promise((resolve) => {
      const imagePaths = images.map((item) => item.path)

      // 发送请求获取图片信息
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.get_images_extra_info,
          data: {
            images: imagePaths,
          },
        },
        ({ gitStaged, metadataResults }) => {
          logger.timeEnd('queryImagesInfo')
          startTransition(() => {
            dispatchImageState({
              updateType: UpdateType.patch,
              id: nanoid(),
              payloads: metadataResults
                .filter((t) => imagePaths.includes(t.filePath))
                .map((item) => {
                  const image = images.find((t) => t.path === item.filePath)
                  return {
                    origin: UpdateOrigin.image,
                    data: {
                      type: UpdateEvent.update,
                      payload: {
                        ...image!,
                        info: {
                          gitStaged: gitStaged.includes(item.filePath),
                          ...item,
                        },
                      },
                    },
                  }
                }),
            })
          })
          resolve(true)
        },
      )
    })
  })

  useDebounceEffect(
    () => {
      abortPromise(
        async () => {
          if (imageInfoQueue.images.length) {
            await queryImagesInfo(imageInfoQueue.images)
            setImageInfoQueue(
              produce((draft) => {
                draft.images = []
              }),
            )
          }
        },
        {
          abortController: imageInfoQueue.abortController,
        },
      )
    },
    [imageInfoQueue.images],
    {
      wait: 60,
    },
  )

  useEffect(
    () => () => {
      if (imageInfoQueue.abortController) {
        imageInfoQueue.abortController.abort()
      }
    },
    [],
  )

  const addQueue = useMemoizedFn((image: ImageType) => {
    setImageInfoQueue(
      produce((draft) => {
        if (image.path) {
          draft.images = uniq([...draft.images, image])
        }
      }),
    )
  })

  return {
    imageState,
    dispatchImageState,
    addQueue,
  }
}

const ImageStore = createStore(useImageStore)

export default ImageStore
