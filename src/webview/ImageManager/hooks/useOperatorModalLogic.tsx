import { ceil, isObject } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button } from 'antd'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MdDoubleArrow } from 'react-icons/md'
import { VscWarning } from 'react-icons/vsc'
import { type RequiredDeep } from 'type-fest'
import { type OperatorResult } from '~/core'
import logger from '~/utils/logger'
import { formatBytes, getFilenameFromPath } from '../utils'

export type FormComponent<T> = {
  [key in ObjectKeys<RequiredDeep<T>>]?: {
    el: () => ReactNode
  }
}

const LoadingKey = 'operator-loading'

function useOperatorModalLogic() {
  const { t } = useTranslation()
  const { message, notification } = App.useApp()

  const onEnd = useMemoizedFn(
    (
      result: OperatorResult[number],
      options: {
        onError?: (filePath: string, error: string) => void
        onRetryClick?: (filePath: string) => void
      },
    ) => {
      const { inputSize, outputSize, filePath, outputPath, error } = result

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

      if (inputSize && outputSize) {
        const percent = ceil(((inputSize - outputSize) / inputSize) * 100)
        const increase = percent < 0

        notification[increase ? 'warning' : 'success']({
          duration: 10,
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

  const handleOperateImage = useMemoizedFn(
    async (
      fn: (filePath?: string) => Promise<OperatorResult | undefined>,
      option: {
        onSuccess: () => void
        onFinal: () => void
      },
    ) => {
      message.loading({
        content: t('im.wait'),
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
        option.onSuccess()
      } catch (e) {
        logger.error(e)
      } finally {
        message.destroy(LoadingKey)
        option.onFinal()
      }
    },
  )

  return {
    handleOperateImage,
  }
}

export default useOperatorModalLogic
