import type { UpdatePayload } from '../../utils/tree/tree-manager'
import type { FullUpdate, PatchUpdate } from '~/message/webview-message-factory'
import { groupBy, remove } from 'es-toolkit'
import { find } from 'es-toolkit/compat'
import { produce } from 'immer'
import { atomWithReducer } from 'jotai/utils'
import logger from '~/utils/logger'
import { UpdateEvent, UpdateOrigin, UpdateType } from '../../utils/tree/const'

export interface Workspace {
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

export enum WorkspaceUpdate {
  reset = 'reset',
}

export const imageStateAtom = atomWithReducer(
  {
    loading: true,
    workspaces: [] as Workspace[],
  },
  (
    state,
    action:
      | FullUpdate
      | PatchUpdate
      | {
        updateType: WorkspaceUpdate.reset
      },
  ) => {
    if (action.updateType === WorkspaceUpdate.reset) {
      state = produce(state, (draft) => {
        draft.workspaces.forEach((workspace) => {
          workspace.update = undefined
        })
      })
    }
    else {
      if (action.updateType === UpdateType.full) {
        state = produce(state, (draft) => {
          const imagePayloads = action.payloads.filter(item => item.origin === UpdateOrigin.image)
          const images = imagePayloads.map(item => item.data.payload)

          const index = draft.workspaces.findIndex(t => t.workspaceFolder === action.workspaceFolder)

          if (index !== -1) {
            draft.workspaces[index].images = images
          }
          else {
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
      }
      else if (action.updateType === UpdateType.patch) {
        // payload按照工作区分组
        const groupedPayload = groupBy(action.payloads, item => item.data.payload.workspaceFolder)
        state = produce(state, (draft) => {
          Object.entries(groupedPayload).forEach(([workspaceFolder, payloads]) => {
            const workspace = find(draft.workspaces, { workspaceFolder })
            if (!workspace) {
              logger.error('Workspace not found:', workspaceFolder)
              return
            }

            workspace.update = {
              payloads,
              type: UpdateType.patch,
            }

            payloads
              .filter(t => t.origin === UpdateOrigin.image)
              .forEach((item) => {
                const { type, payload } = item.data

                // NOTE: 这里的情况和imageUpdate是一一对应的
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
                    remove(workspace.images, image => image.path === payload.path)
                    break
                  }

                  default:
                    break
                }
              })

            payloads
              .filter(t => t.origin === UpdateOrigin.dir)
              .forEach((item) => {
                const { type, payload } = item.data

                // NOTE: 这里的情况和dirUpdate是一一对应的
                switch (type) {
                  case UpdateEvent.delete: {
                    // 清除payload的目录以及子目录下的图片
                    remove(workspace.images, image => image.absDirPath.startsWith(payload.absDirPath))
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
)
