import { memo, type PropsWithChildren, type ReactNode, startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Cascader, ConfigProvider, theme } from 'antd'
import { BsSortDown, BsSortUpAlt } from 'react-icons/bs'
import { MdOutlineKeyboardDoubleArrowRight } from 'react-icons/md'
import { type SortType } from '~/core/persist/workspace/common'

type DisplaySortProps = {
  options: { label: ReactNode; value: string }[]
  value?: string[] | undefined
  onChange?: (value: string[]) => void
}

function DisplaySort(props: DisplaySortProps) {
  const { options, value, onChange } = props
  const { token } = theme.useToken()

  const { t } = useTranslation()

  const [sort, setSort] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  const sortMap: Record<SortType, { label: ReactNode }> = {
    asc: {
      label: (
        <SortLabelUI>
          <BsSortUpAlt />
          <span>{t('im.asc')}</span>
        </SortLabelUI>
      ),
    },
    desc: {
      label: (
        <SortLabelUI>
          <BsSortDown />
          <span>{t('im.desc')}</span>
        </SortLabelUI>
      ),
    },
  }

  const sortOptions = useMemoizedFn(() => {
    return Object.keys(sortMap).map((key) => ({
      label: sortMap[key as SortType].label,
      value: key,
    }))
  })

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Cascader: {
              optionSelectedBg: token.colorPrimaryActive,
              optionPadding: '2px 12px',
              dropdownHeight: 'auto',
              controlWidth: 'auto',
              controlItemWidth: 'auto',
            },
          },
        }}
      >
        <Cascader
          value={sort}
          onChange={(value) => {
            startTransition(() => setSort(value as string[]))
          }}
          options={options.map((item) => ({ ...item, children: sortOptions() }))}
          displayRender={(label) => {
            return (
              <div className={'flex items-center'}>
                <div>{label[0]}</div>
                <div className={'mx-1 flex items-baseline'}>
                  <MdOutlineKeyboardDoubleArrowRight />
                </div>
                {label[1]}
              </div>
            )
          }}
          allowClear={false}
          size={'middle'}
        ></Cascader>
      </ConfigProvider>
    </>
  )
}

export default memo(DisplaySort) as typeof DisplaySort

function SortLabelUI(props: PropsWithChildren) {
  return <div className={'flex items-center space-x-2'}>{props.children}</div>
}
