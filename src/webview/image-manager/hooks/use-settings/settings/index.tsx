import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useTrackedEffect } from 'ahooks'
import { App, Button, Divider, Form, Tabs, type TabsProps } from 'antd'
import { difference, isNil } from 'lodash-es'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import { Colors } from '~/webview/image-manager/utils/color'
import GlobalContext from '../../../contexts/global-context'
import SettingsContext from '../../../contexts/settings-context'
import { type ImperativeModalProps } from '../../use-imperative-modal'
import DisplayGroup from './components/display-group'
import DisplaySort from './components/display-sort'
import DisplayStyle from './components/display-style'
import DisplayType from './components/display-type'
import HoverDetail from './components/hover-detail'
import Item, { useLabelWidth } from './components/item'
import LocaleSegmented from './components/locale-segmented'
import PrimaryColorPicker from './components/primary-color-picker'
import ThemeSegmented from './components/theme-segmented'
import styles from './index.module.css'

enum FormItemKey {
  // general
  language = 'language',
  theme = 'theme',
  primaryColor = 'primary-color',

  // viewer
  displayType = 'display-type',
  displayGroup = 'display-group',
  displayStyle = 'display-style',
  displaySort = 'display-sort',
  backgroundColor = 'background-color',
  hoverShowImageDetail = 'hover-show-image-detail',
}

function Settings(props: ImperativeModalProps) {
  const { onClose } = props

  const { t } = useTranslation()

  const { workspaceState, allImageTypes } = GlobalContext.usePicker(['workspaceState', 'allImageTypes'])

  const {
    primaryColor,
    theme,
    setPrimaryColor,
    setTheme,
    setLanguage,
    language,
    displayImageTypes,
    setDisplayImageTypes,
    displayGroup,
    setDisplayGroup,
    displayStyle,
    setDisplayStyle,
    sort,
    setSort,
    backgroundColor,
    setBackgroundColor,
    hoverShowImageDetail,
    setHoverShowImageDetail,
  } = SettingsContext.usePicker([
    'primaryColor',
    'theme',
    'setPrimaryColor',
    'setTheme',
    'setLanguage',
    'language',
    'displayImageTypes',
    'setDisplayImageTypes',
    'displayGroup',
    'setDisplayGroup',
    'displayStyle',
    'setDisplayStyle',
    'sort',
    'setSort',
    'backgroundColor',
    'setBackgroundColor',
    'hoverShowImageDetail',
    'setHoverShowImageDetail',
  ])

  const [recentBackgroundColors, setRencentBackgroundColors] = useWorkspaceState(
    WorkspaceStateKey.rencent_layout_backgroundColor,
    workspaceState.rencent_layout_backgroundColor,
  )

  const generalItems = [
    {
      labelKey: FormItemKey.language,
      label: t('im.language'),
      children: (
        <Form.Item name='language' noStyle={true}>
          <LocaleSegmented />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.theme,
      label: t('im.theme'),
      children: (
        <Form.Item name='theme' noStyle={true}>
          <ThemeSegmented />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.primaryColor,
      label: t('im.primary_color'),
      children: (
        <Form.Item name='primary-color' noStyle={true}>
          <PrimaryColorPicker
            rencentColors={recentBackgroundColors}
            onRencentColorsChange={setRencentBackgroundColors}
          ></PrimaryColorPicker>
        </Form.Item>
      ),
    },
  ]

  const formStrategy = {
    [FormItemKey.language]: {
      value: language,
      onChange: setLanguage,
    },
    [FormItemKey.theme]: {
      value: theme,
      onChange: setTheme,
    },
    [FormItemKey.primaryColor]: {
      value: primaryColor,
      onChange: setPrimaryColor,
    },
    [FormItemKey.displayType]: {
      value: difference(allImageTypes, displayImageTypes.unchecked),
      onChange: setDisplayImageTypes,
    },
    [FormItemKey.displayGroup]: {
      value: displayGroup,
      onChange: setDisplayGroup,
    },
    [FormItemKey.displayStyle]: {
      value: displayStyle,
      onChange: setDisplayStyle,
    },
    [FormItemKey.displaySort]: {
      value: sort,
      onChange: setSort,
    },
    [FormItemKey.backgroundColor]: {
      value: backgroundColor,
      onChange: setBackgroundColor,
    },
    [FormItemKey.hoverShowImageDetail]: {
      value: hoverShowImageDetail,
      onChange: setHoverShowImageDetail,
    },
  }

  useTrackedEffect(
    (changes) => {
      changes?.forEach((index) => {
        const key = Object.keys(formStrategy)[index]
        form.setFieldsValue({
          [key]: formStrategy[key].value,
        })
      })
    },
    [...Object.values(formStrategy).map((t) => t.value)],
  )

  const resolveInitialValues = useMemoizedFn(() => {
    const initialValues = {}
    for (const key in formStrategy) {
      initialValues[key] = formStrategy[key].value
    }
    return initialValues
  })

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

  const viewerItems = [
    {
      labelKey: FormItemKey.displayType,
      label: t('im.type'),
      children: (
        <Form.Item noStyle={true} name={FormItemKey.displayType}>
          <DisplayType />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.displayGroup,
      label: t('im.group'),
      children: (
        <Form.Item noStyle={true} name={FormItemKey.displayGroup}>
          <DisplayGroup></DisplayGroup>
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.displayStyle,
      label: t('im.layout'),
      children: (
        <Form.Item noStyle={true} name={FormItemKey.displayStyle}>
          <DisplayStyle />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.displaySort,
      label: t('im.sort'),
      children: (
        <Form.Item name={FormItemKey.displaySort} noStyle={true}>
          <DisplaySort options={sortOptions} />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.backgroundColor,
      label: t('im.image_background_color'),
      children: (
        <Form.Item name={FormItemKey.backgroundColor} noStyle={true}>
          <PrimaryColorPicker
            value={backgroundColor}
            onChange={setBackgroundColor}
            rencentColors={recentBackgroundColors}
            onRencentColorsChange={setRencentBackgroundColors}
            extraColors={[Colors.warmBlack]}
          />
        </Form.Item>
      ),
    },
    {
      labelKey: FormItemKey.hoverShowImageDetail,
      label: t('im.show_detail_hover'),
      children: (
        <Form.Item name={FormItemKey.hoverShowImageDetail} noStyle={true}>
          <HoverDetail />
        </Form.Item>
      ),
    },
  ]

  const [viewerLabelWidth, onViewerResize] = useLabelWidth()
  const [generalLabelWidth, onGeneralResize] = useLabelWidth()

  const tabsItems: TabsProps['items'] = [
    {
      key: 'viewer',
      label: t('im.viewer'),
      children: (
        <div className={'flex flex-col gap-4'}>
          {viewerItems.map((item, index) => (
            <Item {...item} key={index} minWidth={viewerLabelWidth} onResize={onViewerResize} />
          ))}
        </div>
      ),
    },
    {
      key: 'general',
      label: t('im.general'),
      children: (
        <div className={'flex flex-col gap-4'}>
          {generalItems.map((item, index) => (
            <Item {...item} key={index} minWidth={generalLabelWidth} onResize={onGeneralResize} />
          ))}
        </div>
      ),
    },
  ]

  const [form] = Form.useForm()
  const { message } = App.useApp()
  const handleConfirm = useMemoizedFn(() => {
    onClose()
    const formValues = form.getFieldsValue()
    for (const key in formValues) {
      const value = formValues[key]
      if (!isNil(value)) {
        formStrategy[key].onChange(formValues[key])
      }
    }
    message.success(t('im.modify_success'))
  })

  return (
    <div className={'select-none'}>
      <Form form={form} initialValues={resolveInitialValues()}>
        <Tabs items={tabsItems} className={styles.tabs}></Tabs>
      </Form>
      <Divider className={'!my-4'} />
      <div className={'flex justify-end'}>
        <Button type={'primary'} size={'middle'} onClick={handleConfirm}>
          {t('im.confirm')}
        </Button>
      </div>
    </div>
  )
}

export default memo(Settings)
