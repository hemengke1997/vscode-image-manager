import type { InputRef } from 'antd/es/input'
import type { FuseResult } from 'fuse.js'
import { useDebounceFn, useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Empty, Input, Tooltip } from 'antd'
import { without } from 'es-toolkit'
import Fuse from 'fuse.js'
import { useAtomValue } from 'jotai'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiSpinnerGapLight } from 'react-icons/pi'
import { VscCaseSensitive, VscWholeWord } from 'react-icons/vsc'
import { Key } from 'ts-key-enum'
import { CmdToVscode } from '~/message/cmd'
import useScrollRef from '~/webview/image-manager/hooks/use-scroll-ref'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { vscodeApi } from '~/webview/vscode-api'
import ImageGroup from '../../components/image-group'
import { GlobalAtoms } from '../../stores/global/global-store'
import { formatPath } from '../../utils/tree/utils'
import Highlight from './components/highlight'
import IconUI from './components/icon-ui'

function ImageSearch() {
  const { t } = useTranslation()

  const searchInputRef = useRef<InputRef>(null)

  const workspaceImages = useAtomValue(GlobalAtoms.workspaceImagesAtom)

  const workspacesImagePatterns = useMemo(
    () =>
      workspaceImages.reduce((prev, cur) => {
        return prev.concat(cur.images)
      }, [] as ImageType[]),
    [workspaceImages],
  )

  // 大小写敏感
  const [caseSensitive, setCaseSensitive] = useState(false)
  // 全字匹配
  const [wholeWord, setWholeWord] = useState(false)

  // includeGlob is a glob pattern to filter the search results
  const [includeGlob, setIncludeGlob] = useState<string>()
  const [excludeGlobal, setExcludeGlobal] = useState<string>()

  const [search, setSearch] = useState<{
    value: string
    source: 'input' | 'keyboard'
  }>()

  // TODO: fuse 搜索并不太精确，配合highlighter使用时，会出现问题
  const fuse = useMemoizedFn(() => {
    const searchValue = search?.value
    let minMatchCharLength = 2
    if (searchValue?.length) {
      minMatchCharLength = Math.max(minMatchCharLength, searchValue.length - 2)
    }
    return new Fuse(workspacesImagePatterns, {
      isCaseSensitive: caseSensitive,
      minMatchCharLength,
      includeMatches: true,
      keys: ['basename'],
      shouldSort: true,
      threshold: wholeWord ? 0 : 0.1,
      distance: wholeWord ? 0 : undefined,
    })
  })

  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === Key.ArrowUp) {
      e.preventDefault()

      if (currentIndex > 0) {
        const newIndex = currentIndex - 1
        setCurrentIndex(newIndex)
        setSearch({
          value: searchHistory[newIndex],
          source: 'keyboard',
        })
      }
      else if (currentIndex < 0 && searchHistory.length) {
        e.preventDefault()
        setCurrentIndex(searchHistory.length - 1)
        setSearch({
          value: searchHistory[searchHistory.length - 1],
          source: 'keyboard',
        })
      }
    }
    else if (e.key === Key.ArrowDown) {
      if (currentIndex < 0)
        return
      if (currentIndex < searchHistory.length - 1) {
        e.preventDefault()
        const newIndex = currentIndex + 1
        setCurrentIndex(newIndex)
        setSearch({ value: searchHistory[newIndex], source: 'keyboard' })
      }
      else if (currentIndex >= searchHistory.length - 1) {
        e.preventDefault()
        setCurrentIndex(-1)
        setSearch({ value: '', source: 'keyboard' })
      }
    }
  })

  const onSearch = useMemoizedFn((value: string) => {
    const newHistory = without(searchHistory, value).concat(value)
    setSearchHistory(newHistory.filter(t => t.trim().length))
    setCurrentIndex(newHistory.length - 1)
  })

  const [searchResult, setSearchResult] = useState<{
    items: FuseResult<ImageType>[]
    searchValue: string
  }>({ items: [], searchValue: '' })

  const filterByGlob = useMemoizedFn((filePaths: string[], glob: string, isExclude: boolean): Promise<string[]> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.micromatch_ismatch,
          data: {
            filePaths,
            globs: glob?.split(',').map(g => g.trim()),
            not: isExclude,
          },
        },
        (res) => {
          resolve(res)
        },
      )
    })
  })

  const generatePath = useMemoizedFn((image: ImageType) => {
    return formatPath(`${image.dirPath}/${image.basename}`)
  })

  const applyFilter = useMemoizedFn(
    async (result: FuseResult<ImageType>[], glob: string | undefined, isExclude: boolean) => {
      if (glob?.trim().length) {
        const filterResult = await filterByGlob(
          result.map(t => generatePath(t.item)),
          glob,
          isExclude,
        )
        return result.filter(t => filterResult.includes(generatePath(t.item)))
      }
      return result
    },
  )

  const [loading, setLoading] = useState(false)

  const handleSearch = useMemoizedFn(async () => {
    setLoading(true)

    try {
      if (search?.source === 'input') {
        onSearch(search.value)
      }

      let result = fuse().search(search?.value ?? '')

      result = await applyFilter(result, includeGlob, false)
      result = await applyFilter(result, excludeGlobal, true)
      setSearchResult({ items: result, searchValue: search?.value || '' })
    }
    finally {
      setLoading(false)
    }
  })

  const { run, cancel } = useDebounceFn(
    () => {
      handleSearch()
    },
    {
      leading: false,
      trailing: true,
      wait: 500,
    },
  )

  useUpdateEffect(() => {
    run()
  }, [search?.value, includeGlob, excludeGlobal])

  useUpdateEffect(() => {
    cancel()
    handleSearch()
  }, [caseSensitive, wholeWord])

  useEffect(() => {
    searchInputRef.current?.focus({ cursor: 'all', preventScroll: true })
  }, [])

  const { scrollRef } = useScrollRef()

  return (
    <>
      <div className='my-4 flex flex-col gap-4'>
        <Input.Search
          ref={searchInputRef}
          classNames={{
            input: 'bg-[var(--ant-input-active-bg)]',
          }}
          className='flex-1'
          autoFocus
          size='middle'
          placeholder={t('im.search_placeholder')}
          suffix={(
            <div className='flex space-x-0.5'>
              <IconUI
                active={caseSensitive}
                onClick={() => {
                  setCaseSensitive(t => !t)
                }}
                title={t('im.casesensitive')}
              >
                <VscCaseSensitive />
              </IconUI>

              <IconUI
                active={wholeWord}
                onClick={() => {
                  setWholeWord(t => !t)
                }}
                title={t('im.wholeword')}
              >
                <VscWholeWord />
              </IconUI>
            </div>
          )}
          enterButton
          value={search?.value}
          onChange={e => setSearch({ value: e.target.value, source: 'input' })}
          onKeyDown={handleKeyDown}
          onSearch={(value) => {
            cancel()
            setSearch({ value, source: 'input' })
            handleSearch()
          }}
        />
        <div className='flex flex-1 gap-4'>
          <div className='flex flex-1 flex-col gap-y-2'>
            <div>{t('im.file_to_include')}</div>
            <Input
              size='middle'
              placeholder={t('im.include_glob_placeholder')}
              value={includeGlob}
              onChange={e => setIncludeGlob(e.target.value)}
              onPressEnter={() => {
                cancel()
                handleSearch()
              }}
            />
          </div>
          <div className='flex flex-1 flex-col gap-y-2'>
            <div>{t('im.file_to_exclude')}</div>
            <Input
              size='middle'
              placeholder={t('im.exclude_glob_placeholder')}
              value={excludeGlobal}
              onChange={e => setExcludeGlobal(e.target.value)}
              onPressEnter={() => {
                cancel()
                handleSearch()
              }}
            />
          </div>
        </div>
      </div>

      <div className='relative flex max-h-[600px] flex-col space-y-1 overflow-y-auto' ref={scrollRef}>
        <div
          className={classNames(
            'pointer-events-none absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center rounded-lg',
          )}
        >
          <PiSpinnerGapLight
            className={classNames('text-4xl opacity-0 transition-all', loading && 'animate-spin opacity-100')}
          />
        </div>
        {!searchResult.items.length
          ? (
              <div className='my-6'>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={(
                    <div className='inline-flex items-center gap-x-1'>
                      <span>{t('im.no_image')}</span>
                      <>
                        {searchResult.searchValue && !loading
                          ? (
                              <span>
                                :
                                {searchResult.searchValue}
                              </span>
                            )
                          : null}
                      </>
                    </div>
                  )}
                />
              </div>
            )
          : (
              <ImageGroup
                images={searchResult.items.map(result => ({
                  ...result.item,
                  nameElement: (
                    <>
                      <Tooltip
                        title={(
                          <Highlight
                            caseSensitive={caseSensitive}
                            matches={result.matches}
                            text={generatePath(result.item)}
                            preLen={result.item.dirPath.length + 1}
                          >
                          </Highlight>
                        )}
                        arrow={false}
                        placement='bottom'
                      >
                        <div className='w-full truncate'>
                          <Highlight
                            caseSensitive={caseSensitive}
                            matches={result.matches}
                            text={result.item.basename}
                          >
                          </Highlight>
                        </div>
                      </Tooltip>
                    </>
                  ),
                }))}
                lazyImageProps={{
                  lazy: {
                    root: scrollRef.current!,
                  },
                }}
              />
            )}
      </div>
    </>
  )
}

export default memo(ImageSearch)
