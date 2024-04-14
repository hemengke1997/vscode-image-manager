import { useControlledState, useDebounceEffect, useMemoizedFn } from '@minko-fe/react-hook'
import { Input, Modal, Tooltip } from 'antd'
import { type InputRef } from 'antd/es/input'
import Fuse, { type FuseResult } from 'fuse.js'
import { type HTMLAttributes, memo, useMemo, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useTranslation } from 'react-i18next'
import { RiFilterOffLine } from 'react-icons/ri'
import { VscCaseSensitive, VscWholeWord } from 'react-icons/vsc'
import { CmdToVscode } from '~/message/cmd'
import { cn } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/GlobalContext'
import useImageContextMenuEvent from '../ContextMenus/components/ImageContextMenu/hooks/useImageContextMenuEvent'
import ImagePreview from '../ImagePreview'

type ImageSearchProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ImageSearch(props: ImageSearchProps) {
  const { open: openProp, onOpenChange } = props
  const { t } = useTranslation()

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  useImageContextMenuEvent({
    on: {
      reveal_in_viewer: () => {
        setOpen(false)
      },
    },
  })

  const searchInputRef = useRef<InputRef>(null)

  const imageData = GlobalContext.useSelector((ctx) => ctx.imageState.data)
  const { treeData } = GlobalContext.usePicker(['treeData'])

  const allImagePatterns = useMemo(() => imageData.flatMap((item) => item.images), [imageData])
  const visibleImagePatterns = useMemo(
    () =>
      treeData.reduce((prev, cur) => {
        return prev.concat(cur.visibleList)
      }, [] as ImageType[]),
    [treeData],
  )

  // 大小写敏感
  const [caseSensitive, setCaseSensitive] = useState(false)
  // 全字匹配
  const [wholeWord, setWholeWord] = useState(false)
  // 是否搜索全部
  const [whetherAll, setWhetherAll] = useState(false)

  // includeGlob is a glob pattern to filter the search results
  const [includeGlob, setIncludeGlob] = useState<string>()

  // TODO: fuse 搜索并不太精确，配合highlighter使用时，会出现问题
  const fuse = useMemoizedFn(() => {
    return new Fuse(whetherAll ? allImagePatterns : visibleImagePatterns, {
      isCaseSensitive: caseSensitive,
      minMatchCharLength: 2,
      includeMatches: true,
      threshold: wholeWord ? 0 : 0.3,
      keys: ['name'],
      shouldSort: true,
      distance: 0,
      location: 0,
    })
  })

  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<FuseResult<ImageType>[]>([])

  const filterByGlob = useMemoizedFn((filePaths: string[], glob: string): Promise<string[]> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.micromatch_ismatch,
          data: {
            filePaths,
            globs: glob?.split(',').map((g) => g.trim()),
          },
        },
        (res) => {
          resolve(res)
        },
      )
    })
  })

  const generateFullPath = useMemoizedFn((image: ImageType) => {
    return `${image.dirPath}/${image.path}`
  })

  const onSearch = useMemoizedFn(async (value: string) => {
    setSearchValue(value)
    let result = fuse().search(value)

    let filterResult: string[] = []

    // ignore empty string
    if (includeGlob?.trim().length) {
      filterResult = await filterByGlob(
        result.map((t) => generateFullPath(t.item)),
        includeGlob,
      )
    } else {
      filterResult = []
    }

    if (filterResult.length) {
      result = result.filter((t) => filterResult.includes(generateFullPath(t.item)))
    }
    setSearchResults(result)
  })

  // When condition change, we need to re-search
  useDebounceEffect(
    () => {
      onSearch(searchValue)
    },
    [caseSensitive, wholeWord, whetherAll, includeGlob],
    {
      leading: true,
      wait: 100,
    },
  )

  return (
    <Modal
      width={'80%'}
      onCancel={() => setOpen(false)}
      open={open}
      footer={null}
      title={t('im.search_image')}
      maskClosable={false}
      afterOpenChange={(open) => {
        if (open) {
          searchInputRef.current?.focus({ cursor: 'all', preventScroll: true })
        }
      }}
      keyboard={false}
    >
      <div className={'my-4 flex justify-between space-x-4'}>
        <Input.Search
          ref={searchInputRef}
          classNames={{
            input: 'bg-[var(--ant-input-active-bg)]',
          }}
          autoFocus
          size='middle'
          placeholder={t('im.search_placeholder')}
          suffix={
            <div className={'flex space-x-0.5'}>
              <IconUI
                active={caseSensitive}
                onClick={() => {
                  setCaseSensitive((t) => !t)
                }}
                title={t('im.casesensitive')}
              >
                <VscCaseSensitive />
              </IconUI>

              <IconUI
                active={wholeWord}
                onClick={() => {
                  setWholeWord((t) => !t)
                }}
                title={t('im.wholeword')}
              >
                <VscWholeWord />
              </IconUI>
              <IconUI
                active={whetherAll}
                onClick={() => {
                  setWhetherAll((t) => !t)
                }}
                title={t('im.disable_filter')}
              >
                <RiFilterOffLine />
              </IconUI>
            </div>
          }
          enterButton
          onSearch={onSearch}
        />
        <Input
          size='middle'
          placeholder={t('im.include_glob_placeholder')}
          value={includeGlob}
          onChange={(e) => setIncludeGlob(e.target.value)}
          onPressEnter={() => {
            onSearch(searchValue)
          }}
        />
      </div>

      <div className={'flex max-h-[600px] flex-col space-y-1 overflow-y-auto'}>
        <ImagePreview
          images={searchResults.map((result) => ({
            ...result.item,
            nameElement: (
              <>
                <Tooltip title={result.item.name} arrow={false} placement='bottom'>
                  <Highlighter
                    key={result.refIndex}
                    findChunks={() =>
                      result.matches?.length
                        ? result.matches?.map((match) => ({
                            start: match.indices[0][0],
                            end: match.indices[0][1] + 1,
                          }))
                        : []
                    }
                    highlightClassName='bg-ant-color-primary rounded-sm text-ant-color-text'
                    textToHighlight={result.item.name}
                    searchWords={[]}
                    caseSensitive={caseSensitive}
                  ></Highlighter>
                </Tooltip>
              </>
            ),
          }))}
          lazyImageProps={{
            contextMenu: {
              enable: {
                reveal_in_viewer: true,
              },
            },
          }}
        />
      </div>
    </Modal>
  )
}

export default memo(ImageSearch)

function IconUI(
  props: {
    active: boolean
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { active, ...rest } = props
  return (
    <div
      className={cn(
        'hover:bg-ant-color-bg-text-hover flex h-full cursor-pointer items-center rounded-md border-solid border-transparent p-0.5 text-lg transition-all',
        active && '!text-ant-color-primary !border-ant-color-primary hover:bg-transparent',
      )}
      {...rest}
    >
      {props.children}
    </div>
  )
}
