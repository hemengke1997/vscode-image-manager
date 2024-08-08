import { Card } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type ForwardedRef, forwardRef, memo, type ReactNode, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSettingsLine } from 'react-icons/ri'
import { WorkspaceStateKey, type WorkspaceStateType } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import PrimaryColorPicker from '~/webview/ui-framework/src/components/custom-config-provider/components/primary-color-picker'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import { Colors } from '../../utils/color'
import { ANIMATION_DURATION } from '../../utils/duration'
import DisplayGroup from '../display-group'
import DisplaySort from '../display-sort'
import DisplayStyle from '../display-style'
import DisplayType from '../display-type'
import TitleIconUI from '../title-icon-UI'

export type ViewerSettingsRef = {
  changeImageType: (checked: string[], unchecked?: string[]) => void
}

function ViewerSettings(_: any, ref: ForwardedRef<ViewerSettingsRef>) {
  useImperativeHandle(ref, () => ({
    changeImageType: onImageTypeChange,
  }))

  const { t } = useTranslation()

  const { mode, workspaceState } = GlobalContext.usePicker(['mode', 'workspaceState'])

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

  const onSortChange = (value: WorkspaceStateType['display_sort']) => {
    setSort(value)
  }

  /* ---------- image background color ---------- */
  const [recentBackgroundColors, setRencentBackgroundColors] = useWorkspaceState(
    WorkspaceStateKey.rencent_image_backgroundColor,
    workspaceState.rencent_image_backgroundColor,
  )

  return (
    <AnimatePresence>
      {mode === 'standard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ANIMATION_DURATION.fast }}
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
                  <DisplaySort options={sortOptions} value={sort} onChange={onSortChange as any} />
                </OperationItemUI>
                <OperationItemUI title={t('im.image_background_color')}>
                  <PrimaryColorPicker
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    rencentColors={recentBackgroundColors}
                    onRencentColorsChange={setRencentBackgroundColors}
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
