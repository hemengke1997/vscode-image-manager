import { type ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GiJumpingDog } from 'react-icons/gi'
import { MdErrorOutline } from 'react-icons/md'
import { TbFileUnknown } from 'react-icons/tb'
import { VscSmiley, VscWarning } from 'react-icons/vsc'
import { useLockFn, useMemoizedFn } from 'ahooks'
import { App, Badge, type BadgeProps, Button, Popconfirm, Tag, theme } from 'antd'
import { gt } from 'es-toolkit/compat'
import { nanoid } from 'nanoid'
import { type OperatorResult } from '~/core/operator/operator'
import { CmdToVscode } from '~/message/cmd'
import { AbortError, TimeoutError } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalStore from '../../stores/global-store'
import { formatBytes, triggerOnce } from '../../utils'
import { type Group, type Groups } from '../use-operation-result/operation-result'
import useImageOperationResult from '../use-operation-result/use-operation-result'
import ErrorRange from './components/error-range'

export type FormComponent<T extends Record<string, any>> = {
  [key in Flatten<T>]?: {
    el?: () => ReactNode
    value?: T[key]
  }
}

const MessageLoadingKey = 'operator-loading'

export type OnEndOptionsType = {
  onRedoClick: (images: ImageType[]) => void
  onUndoClick: (results: OperatorResult[]) => void
}

export function useOperatorModalLogic() {
  const { t } = useTranslation()
  const { message, notification } = App.useApp()
  const { token } = theme.useToken()

  const errorRange = GlobalStore.useStore((ctx) => ctx.extConfig.compression.errorRange)

  const failedImages = useRef<ImageType[]>([])

  const clearOperatorCmdCache = useMemoizedFn((results: OperatorResult[]) => {
    const ids = results.map((result) => result.id)
    vscodeApi.postMessage({ cmd: CmdToVscode.remove_operation_cmd_cache, data: { ids } })
  })

  const resultsRef = useRef<OperatorResult[]>()
  const [showImageOperationResult] = useImageOperationResult({
    afterClose() {
      resultsRef.current && clearOperatorCmdCache(resultsRef.current)
      resultsRef.current = undefined
    },
  })

  const onCompressEnd = useMemoizedFn((results: OperatorResult[], options: OnEndOptionsType) => {
    showImageOperationResult({
      results,
      ...options,
    })
    resultsRef.current = results
  })

  const groupOperatorResults = useMemoizedFn(
    (
      results: OperatorResult[],
      options: {
        errorRange: number
      },
    ) => {
      const groups: Groups = {
        decrease: [],
        error: [],
        increase: [],
        limited: [],
        skiped: [],
      }

      const { errorRange } = options
      const errorRangeByte = errorRange * 1024

      results.forEach((result) => {
        const { inputSize, outputSize, error, isSkiped, isLimited } = result

        if (isSkiped) {
          groups.skiped.push(result)
          return
        } else if (isLimited) {
          groups.limited.push(result)

          return
        } else if (inputSize && outputSize) {
          const increase = gt(outputSize, inputSize + errorRangeByte)
          if (increase) {
            groups.increase.push(result)
          } else {
            groups.decrease.push(result)
          }
        } else if (error) {
          groups.error.push(result)
        }
      })

      return groups
    },
  )

  const getGroupsTitle = useMemoizedFn(
    (
      groups: Groups,
      options?: {
        errorRange: {
          visible: boolean
          value: number
          onChange: (value: number) => void
        }
      },
    ): {
      [key in Group]: {
        content: ReactNode
        visible: boolean
      }
    } => {
      const errors = groups.error
      const increased = groups.increase
      const skiped = groups.skiped
      const limited = groups.limited
      const decreased = groups.decrease
      const { errorRange } = options || {}

      const contentClassName = 'flex items-center gap-1'
      const badgeProps: BadgeProps = {
        color: token.colorPrimary,
        showZero: false,
        overflowCount: Number.POSITIVE_INFINITY,
        className: 'ml-1',
        style: {
          color: token.colorWhite,
        },
      }

      return {
        decrease: {
          content: (
            <div className={contentClassName}>
              <VscSmiley className={'text-ant-color-success'} />
              <span>{t('im.process_success')}</span>

              {errorRange?.visible && (
                <ErrorRange errorRange={errorRange.value} onErrorRangeChange={errorRange.onChange} />
              )}

              <Badge {...badgeProps} count={decreased.length}></Badge>
            </div>
          ),
          visible: decreased.length > 0,
        },
        increase: {
          content: (
            <div className={contentClassName}>
              <VscWarning className={'text-ant-color-warning'} />
              <span>{t('im.size_increase')}</span>
              {errorRange?.visible && errorRange.value > 0 ? (
                <Tag className={'ml-1'} color={'warning'}>
                  {t('im.outof_error_range')} {formatBytes(errorRange.value * 1024)}
                </Tag>
              ) : null}
              <Badge {...badgeProps} count={increased.length}></Badge>
            </div>
          ),
          visible: increased.length > 0,
        },
        error: {
          content: (
            <div className={contentClassName}>
              <MdErrorOutline className={'text-ant-color-error'} />
              <span>{t('im.process_fail')}</span>
              <Badge {...badgeProps} count={errors.length}></Badge>
            </div>
          ),
          visible: errors.length > 0,
        },
        skiped: {
          content: (
            <div className={contentClassName}>
              <GiJumpingDog className={'text-ant-color-text'} />
              <span>{t('im.skip_compressed')}</span>
              <Badge {...badgeProps} count={skiped.length}></Badge>
            </div>
          ),
          visible: skiped.length > 0,
        },
        limited: {
          content: (
            <div className={contentClassName}>
              <TbFileUnknown className={'text-ant-color-warning'} />
              <span>{t('im.image_type_limit')}</span>
              <Badge {...badgeProps} count={limited.length}></Badge>
            </div>
          ),
          visible: limited.length > 0,
        },
      }
    },
  )

  const showCompressFinishedNotification = useMemoizedFn(
    (
      results: OperatorResult[],
      options: {
        onView: () => void
      },
    ) => {
      const groups = groupOperatorResults(results, {
        errorRange,
      })
      const titles = getGroupsTitle(groups)

      const id = nanoid()

      let viewed = false

      notification.open({
        key: id,
        message: t('im.processed'),
        placement: 'top',
        duration: 0,
        closable: true,
        onClose() {
          if (viewed) {
            return
          } else {
            // 点击关闭按钮，用户不查看结果，清除操作缓存
            clearOperatorCmdCache(results)
          }
        },
        description: (
          <div className={'flex flex-col gap-2'}>
            {Object.keys(titles)
              .filter((t) => titles[t as Group].visible)
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
              options.onView()
            })}
          >
            {t('im.click_to_view')}
          </Button>
        ),
      })
    },
  )

  const handleOperateImage = useLockFn(
    async (
      fn: () => Promise<OperatorResult[] | undefined>,
      option: {
        onSuccess: () => void
        onCancel: () => void
        onFinal: () => void
      } & OnEndOptionsType,
    ) => {
      failedImages.current = []
      const { onSuccess, onCancel, onFinal, onRedoClick, onUndoClick } = option
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

        onSuccess()

        if (Array.isArray(res)) {
          // 弹通知窗，告知用户压缩完成
          showCompressFinishedNotification(res, {
            onView: () => {
              onCompressEnd(res, {
                onUndoClick,
                onRedoClick,
              })
            },
          })
        }
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
    groupOperatorResults,
    getGroupsTitle,
  }
}
