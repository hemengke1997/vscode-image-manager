import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Collapse, Tooltip } from 'antd'
import { ceil } from 'lodash-es'
import { type Key, memo, type ReactNode, useMemo, useState } from 'react'
import { GiJumpingDog } from 'react-icons/gi'
import { MdErrorOutline } from 'react-icons/md'
import { TbFileUnknown } from 'react-icons/tb'
import { VscSmiley, VscWarning } from 'react-icons/vsc'
import { type OperatorResult } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import GlobalContext from '~/webview/image-manager/contexts/global-context'
import { vscodeApi } from '~/webview/vscode-api'
import useOperatorModalLogic, { type OnEndOptionsType } from '../../use-operator-modal-logic/use-operator-modal-logic'
import useScrollRef from '../../use-scroll-ref'
import CollapseContent from './components/collapse-content'
import ImageCard from './components/image-card'
import RedoAction from './components/redo-action'
import SizeChange from './components/size-change'
import UndoAction from './components/undo-action'

export type Group = 'limited' | 'skiped' | 'increase' | 'decrease' | 'error'

export type Groups = {
  [key in Group]: OperatorResult[]
}

export type OperatorResultProps = {
  results: OperatorResult[]
} & OnEndOptionsType

function OperatorResultTsx(
  props: OperatorResultProps & {
    id: string
    onClose: (id: string) => void
  },
) {
  const { results: resultsProp, onUndoClick, onRedoClick, id, onClose } = props

  const _errorRange = GlobalContext.useSelector((ctx) => ctx.extConfig.compression.errorRange)
  const [errorRange, setErrorRange] = useExtConfigState(ConfigKey.compression_errorRange, _errorRange, [], {
    wait: 0,
  })

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
      }),
    [groups, errorRange],
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
      onClose(id)
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

  const items: {
    key: Group
    label: ReactNode
    children: ReactNode
    extra?: ReactNode
  }[] = [
    {
      key: 'decrease',
      label: titles.decrease.content,
      extra: <UndoAction onClick={() => onUndoAction(groups.decrease)}></UndoAction>,
      children: (
        <CollapseContent results={groups.decrease}>
          {(item) => (
            <ImageCard
              item={item}
              root={scrollRef.current!}
              actions={[
                <UndoAction
                  onClick={() => {
                    onUndoAction([item])
                  }}
                />,
              ]}
            >
              <div className={'flex flex-col items-center'}>
                <SizeChange inputSize={item.inputSize} outputSize={item.outputSize} />
                <div className={'flex items-center gap-x-2'}>
                  <VscSmiley className='text-ant-color-success flex items-center' />
                  <div className={'text-ant-color-error flex-none font-bold'}>{getPercent(item)}</div>
                </div>
              </div>
            </ImageCard>
          )}
        </CollapseContent>
      ),
    },
    {
      key: 'increase',
      label: titles.increase.content,
      extra: <UndoAction onClick={() => onUndoAction(groups.increase)}></UndoAction>,
      children: (
        <CollapseContent results={groups.increase}>
          {(item) => (
            <ImageCard
              item={item}
              root={scrollRef.current!}
              actions={[
                <UndoAction
                  onClick={() => {
                    onUndoAction([item])
                  }}
                />,
              ]}
            >
              <div className={'flex flex-col items-center'}>
                <SizeChange inputSize={item.inputSize} outputSize={item.outputSize} />
                <div className={'flex items-center gap-x-2'}>
                  <VscWarning className='text-ant-color-warning flex items-center' />
                  <div className={'text-ant-color-error flex-none font-bold'}>{getPercent(item)}</div>
                </div>
              </div>
            </ImageCard>
          )}
        </CollapseContent>
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
        <CollapseContent results={groups.error}>
          {(item) => (
            <ImageCard
              item={item}
              root={scrollRef.current!}
              actions={[
                <RedoAction
                  onClick={() => {
                    onRedoAction([item])
                  }}
                ></RedoAction>,
              ]}
            >
              <div className={'flex flex-wrap items-center justify-center gap-1'}>
                <MdErrorOutline className={'text-ant-color-error'} />
                <Tooltip title={item.error} placement={'bottom'} arrow={false}>
                  <div className={'text-ant-color-text max-w-full truncate text-center'}>{item.error}</div>
                </Tooltip>
              </div>
            </ImageCard>
          )}
        </CollapseContent>
      ),
    },
    {
      key: 'skiped',
      label: titles.skiped.content,
      children: (
        <CollapseContent results={groups.skiped}>
          {(item) => (
            <ImageCard item={item} root={scrollRef.current!}>
              <div className={'flex items-center justify-center gap-1'}>
                <GiJumpingDog className={'text-ant-color-text'} />
              </div>
            </ImageCard>
          )}
        </CollapseContent>
      ),
    },
    {
      key: 'limited',
      label: titles.limited.content,
      children: (
        <CollapseContent results={groups.limited}>
          {(item) => (
            <ImageCard item={item} root={scrollRef.current!}>
              <div className={'flex items-center justify-center gap-x-1'}>
                <TbFileUnknown className={'text-ant-color-warning flex-none'} />
                <Tooltip title={item.error} placement={'bottom'} arrow={false}>
                  <div className={'text-ant-color-text max-w-full truncate text-center'}>{item.error}</div>
                </Tooltip>
              </div>
            </ImageCard>
          )}
        </CollapseContent>
      ),
    },
  ]

  const [activeKeys, setActiveKeys] = useState<Key[]>(items.map((t) => t.key!))

  return (
    <div className={'max-h-[80vh] w-full overflow-y-auto'} ref={scrollRef}>
      <Collapse
        items={items.filter((item) => groups[item.key].length > 0)}
        activeKey={activeKeys as string[]}
        onChange={(key) => setActiveKeys(key as string[])}
        className={'select-none'}
        destroyInactivePanel={true}
        collapsible={'icon'}
      ></Collapse>
    </div>
  )
}

export default memo(OperatorResultTsx)
