import { ceil, isObject } from '@minko-fe/lodash-pro'
import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Popconfirm } from 'antd'
import { type ReactNode } from 'react'
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

const LoadingKey = 'operator-loading'

function useOperatorModalLogic() {
  const { t } = useTranslation()
  const { message, notification } = App.useApp()

  // 压缩结束
  const onEnd = useMemoizedFn(
    (
      result: OperatorResult[number],
      options: {
        onError?: (filePath: string, error: string) => void
        onRetryClick?: (filePath: string) => void
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

        onError?.(filePath, _error || '')
        const notificationKey = `${filename}-compress-fail`
        notification.error({
          duration: null,
          key: notificationKey,
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
                    notification.destroy(notificationKey)
                    onRetryClick?.(filePath)
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
      fn: (filePath?: string) => Promise<OperatorResult | undefined>,
      option: {
        onSuccess: () => void
        onCancel: () => void
        onFinal: () => void
      },
    ) => {
      const { onSuccess, onCancel, onFinal } = option
      message.loading({
        content: (
          <div className={'flex items-center space-x-4'}>
            <div>{t('im.wait')}</div>
            <Popconfirm
              title={t('im.irreversible_operation')}
              description={t('im.cancel_operation_tip')}
              onConfirm={() => {
                onCancel?.()
                message.destroy(LoadingKey)
              }}
              okText={t('im.yes')}
              cancelText={t('im.no')}
            >
              <Button danger>{t('im.cancel')}</Button>
            </Popconfirm>
          </div>
        ),
        duration: 0,
        key: LoadingKey,
      })
      try {
        const res = await fn()
        if (Array.isArray(res)) {
          res.forEach((item) => {
            onEnd(item, {
              onRetryClick: (filePath) => {
                handleOperateImage(() => fn(filePath), option)
              },
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
        message.destroy(LoadingKey)
        onFinal()
      }
    },
  )

  return {
    handleOperateImage,
  }
}

export default useOperatorModalLogic
