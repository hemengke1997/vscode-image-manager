import { type Key, memo, type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoSkip } from 'react-icons/go'
import { MdErrorOutline } from 'react-icons/md'
import { TbFileUnknown } from 'react-icons/tb'
import { VscSmiley, VscWarning } from 'react-icons/vsc'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { type ImperativeModalProps } from 'ahooks-x/use-imperative-antd-modal'
import { App, Collapse, type GetProps, Tooltip } from 'antd'
import { ceil } from 'es-toolkit/compat'
import { produce } from 'immer'
import { ConfigKey } from '~/core/config/common'
import { type OperatorResult } from '~/core/operator/operator'
import { CmdToVscode } from '~/message/cmd'
import ImageGroup from '~/webview/image-manager/components/image-group'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import GlobalStore from '~/webview/image-manager/stores/global-store'
import { vscodeApi } from '~/webview/vscode-api'
import useScrollRef from '../../../use-scroll-ref'
import { type OnEndOptionsType } from '../../use-operation-form-logic'
import { useOperatorModalLogic } from '../../use-operator-modal-logic/use-operator-modal-logic'
import CompareAction from './components/compare-action'
import ImageCard from './components/image-card'
import RedoAction from './components/redo-action'
import SizeChange from './components/size-change'
import UndoAction from './components/undo-action'
import useCompareImage from './hooks/use-compare-image/use-compare-image'

export type Group = 'limited' | 'skiped' | 'increase' | 'decrease' | 'error'

export type Groups = {
  [key in Group]: OperatorResult[]
}

type OperationResultProps = {
  results: OperatorResult[]
} & OnEndOptionsType

function OperationResult(props: OperationResultProps & ImperativeModalProps) {
  const { results: resultsProp, onUndoClick, onRedoClick, closeModal, operationMode } = props

  const { t } = useTranslation()
  const { imageWidth } = GlobalStore.useStore(['imageWidth'])
  const _errorRange = GlobalStore.useStore((ctx) => ctx.extConfig.compression.errorRange)
  const [errorRange, setErrorRange] = useExtConfigState(ConfigKey.compression_errorRange, _errorRange, [])

  const { message } = App.useApp()

  const { scrollRef } = useScrollRef()

  const { getGroupsTitle, groupOperatorResults } = useOperatorModalLogic()

  const [results, setResults] = useState(resultsProp)

  const groups = useMemo(
    () =>
      groupOperatorResults(results, {
        errorRange,
      }),
    [results, errorRange],
  )

  const titles = useMemo(
    () =>
      getGroupsTitle(groups, {
        errorRange: {
          visible: true,
          value: errorRange,
          onChange: setErrorRange,
        },
        operationMode,
      }),
    [groups, errorRange, operationMode],
  )

  const getPercent = useMemoizedFn((result: OperatorResult) => {
    const percent = ceil(((result.inputSize! - result.outputSize!) / result.inputSize!) * 100, 2)
    if (percent >= 0) {
      return `-${Math.abs(percent)}%`
    }
    return `+${Math.abs(percent)}%`
  })

  useUpdateEffect(() => {
    if (Object.keys(groups).every((key) => groups[key].length === 0)) {
      closeModal()
    }
  }, [groups])

  const onUndoAction = useMemoizedFn((items: OperatorResult[]) => {
    onUndoClick(items)

    const ids = items.map((item) => item.id)
    vscodeApi.postMessage({ cmd: CmdToVscode.remove_operation_cmd_cache, data: { ids } })

    setResults((prev) => prev.filter((t) => !items.some((item) => item.id === t.id)))
  })

  const onRedoAction = useMemoizedFn((items: OperatorResult[]) => {
    onRedoClick(items.map((t) => t.image))
    setResults((prev) => prev.filter((t) => !items.some((item) => item.id === t.id)))
  })

  const [showImageComparison] = useCompareImage()

  const [comparisonCache, setComparisonCache] = useState<Map<string, string>>(new Map())

  const onCompareAction = useMemoizedFn(async (item: OperatorResult) => {
    const props = {
      newImage: item.image.vscodePath,
      imageWidth: item.image.info.metadata.width || imageWidth,
    }
    const cachedBase64 = comparisonCache.get(item.id)
    if (cachedBase64) {
      showImageComparison({
        oldImage: cachedBase64,
        ...props,
      })
    } else {
      // 发送命令，将对应commander缓存中的inputBuffer转为base64，并获取结果
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.get_cmd_cache_inputBuffer_as_base64,
          data: { id: item.id },
        },
        (res) => {
          if (res) {
            setComparisonCache(produce((draft) => draft.set(item.id, res)))
            showImageComparison({
              oldImage: res,
              ...props,
            })
          } else {
            message.error(t('im.get_compare_error'))
          }
        },
      )
    }
  })

  const imageGroupProps: Omit<GetProps<typeof ImageGroup>, 'images'> = useMemo(
    () => ({
      lazyImageProps: {
        imageNameProps: {
          tooltipDisplayFullPath: true,
        },
        lazy: {
          root: scrollRef.current!,
        },
      },
      interactive: false,
    }),
    [scrollRef.current],
  )

  const findCorrespondingResult = useMemoizedFn((results: OperatorResult[], image: ImageType) => {
    return results.find((item) => item.image.path === image.path)!
  })

  const items = useMemoizedFn(
    (): {
      key: Group
      label: ReactNode
      children: ReactNode
      extra?: ReactNode
    }[] => [
      {
        key: 'decrease',
        label: titles.decrease.content,
        extra: <UndoAction onClick={() => onUndoAction(groups.decrease)}></UndoAction>,
        children: (
          <ImageGroup
            {...imageGroupProps}
            images={groups.decrease.map((t) => t.image)}
            renderer={(imageNode, image) => (
              <ImageCard
                actions={[
                  <UndoAction
                    key='undo'
                    onClick={() => {
                      onUndoAction([findCorrespondingResult(groups.decrease, image)])
                    }}
                  />,
                  <CompareAction
                    key={'compare'}
                    onClick={() => onCompareAction(findCorrespondingResult(groups.decrease, image))}
                  />,
                ]}
                cover={imageNode}
              >
                <div className={'flex flex-col items-center'}>
                  <SizeChange
                    inputSize={findCorrespondingResult(groups.decrease, image).inputSize}
                    outputSize={findCorrespondingResult(groups.decrease, image).outputSize}
                  />
                  <div className={'flex items-center gap-x-2'}>
                    <VscSmiley className='flex items-center text-ant-color-success' />
                    <div className={'flex-none font-bold text-ant-color-error'}>
                      {getPercent(findCorrespondingResult(groups.decrease, image))}
                    </div>
                  </div>
                </div>
              </ImageCard>
            )}
          ></ImageGroup>
        ),
      },
      {
        key: 'increase',
        label: titles.increase.content,
        extra: <UndoAction onClick={() => onUndoAction(groups.increase)}></UndoAction>,
        children: (
          <ImageGroup
            {...imageGroupProps}
            images={groups.increase.map((t) => t.image)}
            renderer={(lazyImage, image) => (
              <ImageCard
                actions={[
                  <UndoAction
                    key={'undo'}
                    onClick={() => {
                      onUndoAction([findCorrespondingResult(groups.increase, image)])
                    }}
                  />,
                  <CompareAction
                    key={'compare'}
                    onClick={() => onCompareAction(findCorrespondingResult(groups.increase, image))}
                  />,
                ]}
                cover={lazyImage}
              >
                <div className={'flex flex-col items-center'}>
                  <SizeChange
                    inputSize={findCorrespondingResult(groups.increase, image).inputSize}
                    outputSize={findCorrespondingResult(groups.increase, image).outputSize}
                  />
                  <div className={'flex items-center gap-x-2'}>
                    <VscWarning className='flex items-center text-ant-color-warning' />
                    <div className={'flex-none font-bold text-ant-color-error'}>
                      {getPercent(findCorrespondingResult(groups.increase, image))}
                    </div>
                  </div>
                </div>
              </ImageCard>
            )}
          ></ImageGroup>
        ),
      },
      {
        key: 'error',
        label: titles.error.content,
        extra: (
          <RedoAction
            onClick={() => {
              onRedoAction(groups.error)
            }}
          ></RedoAction>
        ),
        children: (
          <ImageGroup
            {...imageGroupProps}
            images={groups.error.map((t) => t.image)}
            renderer={(lazyImage, image) => (
              <ImageCard
                actions={[
                  <RedoAction
                    key='redo'
                    onClick={() => {
                      onRedoAction([findCorrespondingResult(groups.error, image)])
                    }}
                  ></RedoAction>,
                ]}
                cover={lazyImage}
              >
                <div className={'flex flex-wrap items-center justify-center gap-1'}>
                  <MdErrorOutline className={'text-ant-color-error'} />
                  <Tooltip
                    title={findCorrespondingResult(groups.error, image).error}
                    placement={'bottom'}
                    arrow={false}
                  >
                    <div className={'max-w-full truncate text-center text-ant-color-text'}>
                      {findCorrespondingResult(groups.error, image).error}
                    </div>
                  </Tooltip>
                </div>
              </ImageCard>
            )}
          ></ImageGroup>
        ),
      },
      {
        key: 'skiped',
        label: titles.skiped.content,
        children: (
          <ImageGroup
            {...imageGroupProps}
            images={groups.skiped.map((t) => t.image)}
            renderer={(lazyImage) => (
              <ImageCard cover={lazyImage}>
                <div className={'flex items-center justify-center gap-1'}>
                  <GoSkip className={'text-ant-color-text'} />
                </div>
              </ImageCard>
            )}
          ></ImageGroup>
        ),
      },
      {
        key: 'limited',
        label: titles.limited.content,
        children: (
          <ImageGroup
            {...imageGroupProps}
            images={groups.limited.map((t) => t.image)}
            renderer={(lazyImage, image) => (
              <ImageCard cover={lazyImage}>
                <div className={'flex items-center justify-center gap-x-1'}>
                  <TbFileUnknown className={'flex-none text-ant-color-warning'} />
                  <Tooltip
                    title={findCorrespondingResult(groups.limited, image).error}
                    placement={'bottom'}
                    arrow={false}
                  >
                    <div className={'max-w-full truncate text-center text-ant-color-text'}>
                      {findCorrespondingResult(groups.limited, image).error}
                    </div>
                  </Tooltip>
                </div>
              </ImageCard>
            )}
          ></ImageGroup>
        ),
      },
    ],
  )

  const [activeKeys, setActiveKeys] = useState<Key[]>(items().map((t) => t.key!))

  return (
    <div className={'max-h-[80vh] w-full overflow-y-auto'} ref={scrollRef}>
      <Collapse
        items={items().filter((item) => groups[item.key].length > 0)}
        activeKey={activeKeys as string[]}
        onChange={(key) => setActiveKeys(key as string[])}
        className={'select-none'}
        destroyInactivePanel={true}
        collapsible={'icon'}
      ></Collapse>
    </div>
  )
}

export default memo(OperationResult)
