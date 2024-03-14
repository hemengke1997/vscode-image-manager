import { Card } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type ForwardedRef, type ReactNode, forwardRef, memo, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSettingsLine } from 'react-icons/ri'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import { LocalStorageEnum } from '~/webview/local-storage'
import PrimaryColorPicker from '~/webview/ui-framework/src/components/CustomConfigProvider/components/PrimaryColorPicker'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import { Colors } from '../../utils/color'
import DisplayGroup from '../DisplayGroup'
import DisplaySort from '../DisplaySort'
import DisplayStyle from '../DisplayStyle'
import DisplayType from '../DisplayType'
import TitleIconUI from '../TitleIconUI'

export type ViewerSettingsRef = {
  changeImageType: (checked: string[], unchecked?: string[]) => void
}

function ViewerSettings(_: any, ref: ForwardedRef<ViewerSettingsRef>) {
  useImperativeHandle(ref, () => ({
    changeImageType: onImageTypeChange,
  }))

  const { t } = useTranslation()

  const { update } = useConfiguration()
  const { mode } = GlobalContext.usePicker(['mode'])

  const {
    sort,
    setSort,
    displayStyle,
    setDisplayStyle,
    displayGroup,
    setDisplayGroup,
    displayImageTypes,
    setDisplayImageTypes,
    backgroundColor,
    setBackgroundColor,
  } = SettingsContext.usePicker([
    'sort',
    'setSort',
    'displayStyle',
    'setDisplayStyle',
    'displayGroup',
    'setDisplayGroup',
    'displayImageTypes',
    'setDisplayImageTypes',
    'backgroundColor',
    'setBackgroundColor',
  ])

  /* ------------ image type checkbox ----------- */
  const onImageTypeChange = (checked: string[], unchecked?: string[]) => {
    setDisplayImageTypes((t) => ({
      checked: checked || t?.checked || [],
      unchecked: unchecked || t?.unchecked || [],
    }))
  }

  /* ---------------- image sort ---------------- */
  const sortOptions = [
    {
      label: t('im.name_sort'),
      value: 'name',
    },
    {
      label: t('im.size_sort'),
      value: 'size',
    },
  ]

  const onSortChange = (value: string[]) => {
    setSort(value)
  }

  return (
    <AnimatePresence>
      {mode === 'standard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Card title={<TitleIconUI icon={<RiSettingsLine />}>{t('im.settings')}</TitleIconUI>}>
            <div className={'flex flex-col gap-y-3'}>
              <OperationItemUI title={t('im.type')}>
                <DisplayType value={displayImageTypes?.checked || []} onChange={onImageTypeChange} />
              </OperationItemUI>

              <div className={'flex flex-wrap items-center gap-x-5 gap-y-1'}>
                <OperationItemUI title={t('im.group')}>
                  <DisplayGroup value={displayGroup} onChange={setDisplayGroup}></DisplayGroup>
                </OperationItemUI>
                <OperationItemUI title={t('im.layout')}>
                  <DisplayStyle value={displayStyle} onChange={setDisplayStyle} />
                </OperationItemUI>
                <OperationItemUI title={t('im.sort')}>
                  <DisplaySort options={sortOptions} value={sort} onChange={onSortChange} />
                </OperationItemUI>
                <OperationItemUI title={t('im.image_background_color')}>
                  <PrimaryColorPicker
                    value={backgroundColor}
                    onChange={(color) => {
                      setBackgroundColor(color)
                      return new Promise((resolve) => {
                        update(
                          {
                            key: ConfigKey.viewer_imageBackgroundColor,
                            value: color,
                          },
                          () => {
                            resolve()
                          },
                        )
                      })
                    }}
                    localKey={LocalStorageEnum.LOCAL_STORAGE_BACKGROUND_RECENT_COLORS_KEY}
                    extraColors={[Colors.warmBlack]}
                  />
                </OperationItemUI>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(forwardRef<ViewerSettingsRef>(ViewerSettings))

type OperationItemProps = {
  children: ReactNode
  title: ReactNode
}

function OperationItemUI(props: OperationItemProps) {
  const { children, title } = props
  return (
    <div className={'flex-center space-x-4'}>
      <div className={'font-semibold'}>{title}</div>
      {children}
    </div>
  )
}
