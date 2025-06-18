import type { Group } from './use-operation-result/operation-result'
import type { OperatorResult } from '~/core/operator/operator'
import { useLockFn, useMemoizedFn } from 'ahooks'
import { App, Button, Popconfirm } from 'antd'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { nanoid } from 'nanoid'
import { type ReactNode, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CmdToVscode } from '~/message/cmd'
import { AbortError, abortPromise, TimeoutError } from '~/utils/abort-promise'
import { vscodeApi } from '~/webview/vscode-api'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import { triggerOnce } from '../../utils'
import useAbortController from '../use-abort-controller'
import useImageOperation from '../use-image-operation'
import { useTrackState } from '../use-track-state'
import useOperationResult from './use-operation-result/use-operation-result'
import { useOperatorModalLogic } from './use-operator-modal-logic/use-operator-modal-logic'

export type FormComponent<T extends Record<string, any>> = {
  [key in Flatten<T>]?: {
    el?: () => ReactNode
    value?: T[key]
  }
}

const MessageLoadingKey = 'operator-loading'

export enum OperatorMode {
  compression = 'compression',
  conversion = 'conversion',
}

export interface OnOperationType { onSuccess: () => void, onCancel: () => void, onFinal: () => void }

export interface OnEndOptionsType {
  onRedoClick: (images: ImageType[]) => void
  onUndoClick: (results: OperatorResult[]) => void
  /**
   * 操作模式
   * - compression: 压缩
   * - conversion: 转换格式
   */
  operationMode: OperatorMode
}

/**
 * 封装图片处理表单中的通用逻辑
 */
export default function useOperationFormLogic<T>({
  images: imagesProp,
  apiCommand,
  timeoutMultiplier = 15,
  onOperation,
}: {
  images: ImageType[]
  apiCommand: CmdToVscode
  timeoutMultiplier?: number
  onOperation: Pick<OnOperationType & OnEndOptionsType, 'onRedoClick' | 'onSuccess' | 'operationMode'>
}) {
  const { t } = useTranslation()
  const { message, notification } = App.useApp()

  const [images, setImages] = useTrackState(imagesProp)
  // 表单提交状态
  const [submitting, setSubmitting] = useState(false)
  const abortController = useAbortController()
  const { beginUndoProcess } = useImageOperation()
  const { getGroupsTitle, groupOperatorResults } = useOperatorModalLogic()

  const errorRange = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.compression.errorRange),
    ),
  )

  const clearOperatorCmdCache = useMemoizedFn((results: OperatorResult[]) => {
    const ids = results.map(result => result.id)
    vscodeApi.postMessage({ cmd: CmdToVscode.remove_operation_cmd_cache, data: { ids } })
  })

  const resultsRef = useRef<OperatorResult[]>()
  const { showOperationResult } = useOperationResult({
    afterClose() {
      resultsRef.current && clearOperatorCmdCache(resultsRef.current)
      resultsRef.current = undefined
    },
  })

  const onEnd = useMemoizedFn((results: OperatorResult[], options: OnEndOptionsType) => {
    showOperationResult({
      results,
      ...options,
    })
    resultsRef.current = results
  })

  const showFinishedNotification = useMemoizedFn(
    (
      results: OperatorResult[],
      options: {
        onView: () => void
        operationMode: OperatorMode
      },
    ) => {
      const { onView, operationMode } = options
      const groups = groupOperatorResults(results, {
        errorRange,
      })
      const titles = getGroupsTitle(groups, {
        operationMode,
      })

      const id = nanoid()

      let viewed = false

      notification.open({
        key: id,
        message: t('im.processed'),
        placement: 'top',
        duration: 0,
        closable: true,
        onClose() {
          if (!viewed) {
            // 点击关闭按钮，用户不查看结果，清除操作缓存
            clearOperatorCmdCache(results)
          }
        },
        description: (
          <div className='flex flex-col gap-2'>
            {Object.keys(titles)
              .filter(t => titles[t as Group].visible)
              .map((item, index) => (
                <div key={index}>{titles[item as Group].content}</div>
              ))}
          </div>
        ),
        actions: (
          <Button
            onClick={triggerOnce(() => {
              viewed = true
              notification.destroy(id)
              onView()
            })}
          >
            {t('im.click_to_view')}
          </Button>
        ),
      })
    },
  )

  const handleOperateImage = useLockFn(
    async (fn: () => Promise<OperatorResult[] | undefined>, option: OnOperationType & OnEndOptionsType) => {
      const { onSuccess, onCancel, onFinal, onRedoClick, onUndoClick, operationMode } = option
      const timer = setTimeout(() => {
        message.loading({
          content: (
            <div className='flex items-center space-x-4'>
              <div>{t('im.wait')}</div>
              <Popconfirm
                title={t('im.irreversible_operation')}
                description={t('im.cancel_operation_tip')}
                onConfirm={() => {
                  onCancel?.()
                  message.destroy(MessageLoadingKey)
                }}
                okText={t('im.yes')}
                cancelText={t('im.no')}
                zIndex={9999}
              >
                <Button danger>{t('im.cancel')}</Button>
              </Popconfirm>
            </div>
          ),
          duration: 0,
          key: MessageLoadingKey,
        })
      }, 500)

      try {
        const res = await fn()

        onSuccess()

        if (Array.isArray(res)) {
          // 弹通知窗，告知用户操作完成
          showFinishedNotification(res, {
            onView: () => {
              onEnd(res, {
                onUndoClick,
                onRedoClick,
                operationMode,
              })
            },
            operationMode,
          })
        }
      }
      catch (e) {
        if (e instanceof TimeoutError) {
          // 超时
          message.error(t('im.timeout'))
        }
        else if (e instanceof AbortError) {
          // 用户手动取消
          message.error(t('im.canceled'))
        }
        else {
          message.error(`${t('im.operation_failed')}: ${e}`)
        }
      }
      finally {
        clearTimeout(timer)
        message.destroy(MessageLoadingKey)
        onFinal()
      }
    },
  )

  const performOperation = useMemoizedFn((images: ImageType[], option: T) => {
    const fn = () =>
      new Promise<OperatorResult[] | undefined>((resolve, reject) => {
        vscodeApi.postMessage({ cmd: apiCommand, data: { images, option } }, (data: any) => {
          if (data.error) {
            reject(data.error)
          }
          else {
            resolve(data as OperatorResult[])
          }
        })
      })

    return abortPromise(fn, {
      abortController,
      timeout: (timeoutMultiplier + images.length) * 1000,
    })
  })

  const onFinish = useMemoizedFn((option: T) => {
    handleOperateImage(() => performOperation(images, option), {
      ...onOperation,
      onCancel: () => abortController.abort(),
      onFinal: () => setSubmitting(false),
      onUndoClick: results => beginUndoProcess(results),
    })
  })

  return {
    images,
    setImages,
    submitting,
    setSubmitting,
    onFinish,
    abortController,
  }
}
