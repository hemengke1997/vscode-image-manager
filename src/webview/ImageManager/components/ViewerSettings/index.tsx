import { uniq } from '@minko-fe/lodash-pro'
import { Card } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type ForwardedRef, type ReactNode, forwardRef, memo, useImperativeHandle, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import { LocalStorageEnum } from '~/webview/local-storage'
import PrimaryColorPicker from '~/webview/ui-framework/src/components/CustomConfigProvider/components/PrimaryColorPicker'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import { Colors } from '../../utils/color'
import DisplayGroup, { type GroupType } from '../DisplayGroup'
import DisplaySort from '../DisplaySort'
import DisplayStyle from '../DisplayStyle'
import DisplayType from '../DisplayType'

export type ViewerSettingsRef = {
  changeImageType: (checked: string[], unchecked?: string[]) => void
}

function ViewerSettings(_: any, ref: ForwardedRef<ViewerSettingsRef>) {
  useImperativeHandle(ref, () => ({
    changeImageType: onImageTypeChange,
  }))

  const { t } = useTranslation()

  const { update } = useConfiguration()
  const { imageState, mode } = GlobalContext.usePicker(['imageState', 'mode'])

  /* ------------ image type checkbox ----------- */
  const allImageTypes = useMemo(() => uniq(imageState.data.flatMap((item) => item.fileTypes)).sort(), [imageState.data])
  const allImageFiles = useMemo(() => imageState.data.flatMap((item) => item.imgs).sort(), [imageState.data])

  const onImageTypeChange = (checked: string[], unchecked?: string[]) => {
    setDisplayImageTypes((t) => ({
      checked: checked || t?.checked || [],
      unchecked: unchecked || t?.unchecked || [],
    }))
  }

  /* ---------------- image group --------------- */
  const groupType: { label: string; value: GroupType; hidden?: boolean }[] = useMemo(
    () => [
      {
        label: 'TODO: workspace',
        value: 'workspace',
        hidden: true,
      },
      {
        label: t('im.group_by_dir'),
        value: 'dir',
      },
      {
        label: t('im.group_by_type'),
        value: 'type',
      },
    ],
    [t],
  )

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
  } = SettingsContext.useSelector((ctx) => ctx)

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
          <Card size='small' title={t('im.settings')}>
            <div className={'flex flex-col space-y-3'}>
              <OperationItemUI title={t('im.type')}>
                <DisplayType
                  imageType={{
                    all: allImageTypes,
                    checked: displayImageTypes?.checked || [],
                  }}
                  images={allImageFiles}
                  onImageTypeChange={onImageTypeChange}
                />
              </OperationItemUI>

              <div className={'flex items-center space-x-6'}>
                <OperationItemUI title={t('im.group')}>
                  <DisplayGroup
                    options={groupType
                      .filter((t) => !t.hidden)
                      .map((item) => ({ label: item.label, value: item.value }))}
                    value={displayGroup}
                    onChange={setDisplayGroup}
                  ></DisplayGroup>
                </OperationItemUI>
                <OperationItemUI title={t('im.style')}>
                  <DisplayStyle value={displayStyle} onChange={setDisplayStyle} />
                </OperationItemUI>
              </div>

              <div className={'flex space-x-6'}>
                <OperationItemUI title={t('im.sort')}>
                  <DisplaySort options={sortOptions} value={sort} onChange={onSortChange} />
                </OperationItemUI>
                <OperationItemUI title={t('im.image_background_color')}>
                  <PrimaryColorPicker
                    value={backgroundColor}
                    onChange={(color) => {
                      return new Promise((resolve) => {
                        update(
                          {
                            key: ConfigKey.viewer_imageBackgroundColor,
                            value: color,
                          },
                          () => {
                            setBackgroundColor(color)
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
    <div className={'flex items-center space-x-4'}>
      <div className={'font-semibold'}>{title}</div>
      {children}
    </div>
  )
}
