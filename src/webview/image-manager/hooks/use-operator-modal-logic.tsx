import { ceil, isObject } from '@minko-fe/lodash-pro'
import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Popconfirm } from 'antd'
import { type ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MdDoubleArrow } from 'react-icons/md'
import { VscWarning } from 'react-icons/vsc'
import { type OperatorResult } from '~/core'
import { AbortError, TimeoutError } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { formatBytes, getFilenameFromPath } from '../utils'
import { LOADING_DURATION } from '../utils/duration'

export type FormComponent<T extends Record<string, any>> = {
  [key in Flatten<T>]?: {
    el?: () => ReactNode
    value?: T[key]
  }
}

const MessageLoadingKey = 'operator-loading'

function useOperatorModalLogic(props: { images: ImageType[] }) {
  const { images } = props
  const { t } = useTranslation()
  const { message, notification } = App.useApp()

  const failedImages = useRef<ImageType[]>([])

  // 压缩结束
  const onEnd = useMemoizedFn(
    (
      result: OperatorResult[number],
      options: {
        onError?: (filePath: string, error: string) => void
        onRetryClick?: (images: ImageType[]) => void
      },
    ) => {
      const { inputSize, outputSize, filePath, outputPath, error, isSkiped, isLimited } = result

      let filename: ReactNode = null
      if (outputPath && outputPath !== filePath) {
        // converted
        const prevFilename = getFilenameFromPath(filePath)
        const currentFilename = getFilenameFromPath(outputPath)
        filename = (
          <div className={'flex flex-wrap items-center space-x-2'}>
            <div>{prevFilename}</div>
            <div className={'flex items-center'}>
              <MdDoubleArrow />
            </div>
            <div>{currentFilename}</div>
          </div>
        )
      } else {
        filename = getFilenameFromPath(filePath)
      }

      // 如果跳过了压缩
      if (isSkiped) {
        notification.warning({
          duration: LOADING_DURATION.fast,
          message: filename,
          placement: 'bottomRight',
          description: t('im.skip_compressed'),
        })
      } else if (isLimited) {
        notification.warning({
          duration: LOADING_DURATION.fast,
          message: filename,
          placement: 'bottomRight',
          description: error,
        })
      } else if (inputSize && outputSize) {
        const percent = ceil(((inputSize - outputSize) / inputSize) * 100)
        const increase = percent < 0

        notification[increase ? 'warning' : 'success']({
          duration: LOADING_DURATION.slow,
          message: filename,
          placement: 'topRight',
          description: (
            <div className={'flex items-center space-x-2'}>
              <div className={'flex items-center space-x-2'}>
                {increase ? (
                  <>
                    <div className='text-ant-color-warning flex items-center'>
                      <VscWarning />
                    </div>
                    <div>{t('im.size_increase')}</div>
                  </>
                ) : null}
                <div className={'text-ant-color-error font-bold'}>
                  {increase ? '+' : '-'}
                  {Math.abs(percent)}%
                </div>
              </div>
              <div className={'text-ant-color-text-secondary flex items-center space-x-1'}>
                <span>({formatBytes(inputSize)}</span>
                <div className={'flex items-center'}>
                  <MdDoubleArrow />
                </div>
                <span>{formatBytes(outputSize)})</span>
              </div>
            </div>
          ),
        })
      } else if (error) {
        const { onError, onRetryClick } = options
        const _error = isObject(error) ? JSON.stringify(error) : error
        failedImages.current = [...failedImages.current, images.find((item) => item.path === filePath)!]
        onError?.(filePath, _error || '')
        const notificationKey = (key: string) => `${key}-compress-fail`
        notification.error({
          duration: LOADING_DURATION.slow,
          key: notificationKey(filePath),
          message: filename,
          placement: 'topLeft',
          description: (
            <div className={'flex flex-col space-y-2'}>
              <div>
                {t('im.operation_failed')}: {_error}
              </div>
              <div>
                <Button
                  onClick={() => {
                    failedImages.current.forEach((item) => {
                      notification.destroy(notificationKey(item.path))
                    })
                    onRetryClick?.(failedImages.current)
                  }}
                >
                  {t('im.retry')}
                </Button>
              </div>
            </div>
          ),
        })
      }
    },
  )

  const handleOperateImage = useLockFn(
    async (
      fn: () => Promise<OperatorResult | undefined>,
      option: {
        onSuccess: () => void
        onCancel: () => void
        onFinal: () => void
        onRetryClick: (images: ImageType[]) => void
      },
    ) => {
      failedImages.current = []
      const { onSuccess, onCancel, onFinal, onRetryClick } = option
      const timer = setTimeout(() => {
        message.loading({
          content: (
            <div className={'flex items-center space-x-4'}>
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
              >
                <Button danger>{t('im.cancel')}</Button>
              </Popconfirm>
            </div>
          ),
          duration: 0,
          key: MessageLoadingKey,
        })
        clearTimeout(timer)
      }, 500)

      try {
        const res = await fn()
        clearTimeout(timer)

        if (Array.isArray(res)) {
          res.forEach((item) => {
            onEnd(item, {
              onRetryClick,
            })
          })
        }
        onSuccess()
      } catch (e) {
        if (e instanceof TimeoutError) {
          // 超时
          message.error({
            content: t('im.timout'),
          })
        } else if (e instanceof AbortError) {
          // 用户手动取消
          message.error({
            content: t('im.canceled'),
          })
        }
        logger.error(e)
      } finally {
        message.destroy(MessageLoadingKey)
        onFinal()
      }
    },
  )

  return {
    handleOperateImage,
  }
}

export default useOperatorModalLogic
