import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GoSkip } from 'react-icons/go'
import { MdErrorOutline } from 'react-icons/md'
import { TbFileUnknown } from 'react-icons/tb'
import { VscSmiley, VscWarning } from 'react-icons/vsc'
import { useMemoizedFn } from 'ahooks'
import { Badge, type BadgeProps, Tag, theme } from 'antd'
import { gt } from 'es-toolkit/compat'
import { type OperatorResult } from '~/core/operator/operator'
import { formatBytes } from '../../../utils'
import { type OperatorMode } from '../use-operation-form-logic'
import { type Group, type Groups } from '../use-operation-result/operation-result'
import ErrorRange from './components/error-range'

export function useOperatorModalLogic() {
  const { t } = useTranslation()
  const { token } = theme.useToken()

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
      options: {
        errorRange?: {
          visible: boolean
          value: number
          onChange: (value: number) => void
        }
        operationMode: OperatorMode
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
      const { errorRange, operationMode } = options || {}

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

      const skipTip: Record<OperatorMode, string> = {
        compression: t('im.skip_compressed'),
        conversion: t('im.skip_same_ext'),
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
              <GoSkip className={'text-ant-color-text'} />
              <span>{skipTip[operationMode]}</span>
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

  return {
    groupOperatorResults,
    getGroupsTitle,
  }
}
