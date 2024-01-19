import { useControlledState, useUpdateEffect } from '@minko-fe/react-hook'
import { Input, Modal } from 'antd'
import { type InputRef } from 'antd/es/input'
import classNames from 'classnames'
import Fuse, { type FuseResult } from 'fuse.js'
import { type HTMLAttributes, memo, useMemo, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useTranslation } from 'react-i18next'
import { VscCaseSensitive, VscWholeWord } from 'react-icons/vsc'
import { CmdToVscode } from '@/message/constant'
import { vscodeApi } from '@/webview/vscode-api'
import { type ImageType } from '../..'
import GlobalContext from '../../contexts/GlobalContext'
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

  const searchInputRef = useRef<InputRef>(null)

  const imageData = GlobalContext.useSelector((ctx) => ctx.imageState.data)
  const allImages = useMemo(() => imageData.flatMap((item) => item.imgs), [imageData])

  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)

  const [includeGlob, setIncludeGlob] = useState<string>()

  const fuse = useMemo(
    () =>
      new Fuse(allImages, {
        isCaseSensitive: caseSensitive,
        minMatchCharLength: 2,
        includeMatches: true,
        threshold: wholeWord ? 0 : 0.3,
        keys: ['name'],
      }),
    [allImages, caseSensitive, wholeWord],
  )

  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<FuseResult<ImageType>[]>([])

  const filterByGlob = (filePaths: string[], glob: string): Promise<string[]> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.MICROMATCH_ISMATCH,
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
  }

  const generateFullPath = (image: ImageType) => {
    return `${image.dirPath}/${image.path}`
  }

  const onSearch = async (value: string) => {
    setSearchValue(value)
    let result = fuse.search(value)

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
  }

  // When caseSensitive change, we need to re-search
  useUpdateEffect(() => {
    onSearch(searchValue)
  }, [caseSensitive])

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
          allowClear
          onPressEnter={() => {
            onSearch(searchValue)
          }}
        />
      </div>

      <div className={'flex max-h-96 flex-col space-y-1 overflow-y-auto'}>
        <ImagePreview
          images={searchResults.map((result) => ({
            ...result.item,
            nameElement: (
              <>
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
              </>
            ),
          }))}
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
      className={classNames(
        'flex-center text-sm h-full p-0.5 border-solid border-transparent rounded-md transition-all cursor-pointer hover:bg-ant-color-bg-text-hover',
        active && '!text-ant-color-primary !border-ant-color-primary hover:bg-transparent',
      )}
      {...rest}
    >
      {props.children}
    </div>
  )
}
