import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useTrackedEffect } from 'ahooks'
import { App, Button, Divider, Form, Tabs, type TabsProps } from 'antd'
import { isNil } from 'lodash-es'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import AlignColumn, { useColumnWidth } from '~/webview/image-manager/components/align-column'
import AppearMotion from '~/webview/image-manager/components/align-column/components/appear-motion'
import { Colors } from '~/webview/image-manager/utils/color'
import GlobalContext from '../../../contexts/global-context'
import SettingsContext from '../../../contexts/settings-context'
import { type ImperativeModalProps } from '../../use-imperative-modal'
import DisplayGroup from './components/display-group'
import DisplaySort from './components/display-sort'
import DisplayStyle from './components/display-style'
import HoverDetail from './components/hover-detail'
import LocaleSegmented from './components/locale-segmented'
import PrimaryColorPicker from './components/primary-color-picker'
import ThemeSegmented from './components/theme-segmented'
import styles from './index.module.css'

enum SettingsKey {
  // general
  language = 'language',
  theme = 'theme',
  primaryColor = 'primary-color',

  // viewer
  displayGroup = 'display-group',
  displayStyle = 'display-style',
  displaySort = 'display-sort',
  backgroundColor = 'background-color',
  hoverShowImageDetail = 'hover-show-image-detail',
}

function Settings(props: ImperativeModalProps) {
  const { onClose } = props

  const { t } = useTranslation()

  const { workspaceState } = GlobalContext.usePicker(['workspaceState'])

  const {
    primaryColor,
    theme,
    setPrimaryColor,
    setTheme,
    setLanguage,
    language,
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
      key: SettingsKey.language,
      label: t('im.language'),
      children: (
        <Form.Item name={SettingsKey.language} noStyle={true}>
          <LocaleSegmented />
        </Form.Item>
      ),
    },
    {
      key: SettingsKey.theme,
      label: t('im.theme'),
      children: (
        <Form.Item name={SettingsKey.theme} noStyle={true}>
          <ThemeSegmented />
        </Form.Item>
      ),
    },
    {
      key: SettingsKey.primaryColor,
      label: t('im.primary_color'),
      children: (
        <Form.Item name={SettingsKey.primaryColor} noStyle={true}>
          <PrimaryColorPicker
            rencentColors={recentBackgroundColors}
            onRencentColorsChange={setRencentBackgroundColors}
          ></PrimaryColorPicker>
        </Form.Item>
      ),
    },
  ]

  const formStrategy = {
    [SettingsKey.language]: {
      value: language,
      onChange: setLanguage,
    },
    [SettingsKey.theme]: {
      value: theme,
      onChange: setTheme,
    },
    [SettingsKey.primaryColor]: {
      value: primaryColor,
      onChange: setPrimaryColor,
    },
    [SettingsKey.displayGroup]: {
      value: displayGroup,
      onChange: setDisplayGroup,
    },
    [SettingsKey.displayStyle]: {
      value: displayStyle,
      onChange: setDisplayStyle,
    },
    [SettingsKey.displaySort]: {
      value: sort,
      onChange: setSort,
    },
    [SettingsKey.backgroundColor]: {
      value: backgroundColor,
      onChange: setBackgroundColor,
    },
    [SettingsKey.hoverShowImageDetail]: {
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
      key: SettingsKey.displayGroup,
      label: t('im.group'),
      children: (
        <Form.Item noStyle={true} name={SettingsKey.displayGroup}>
          <DisplayGroup></DisplayGroup>
        </Form.Item>
      ),
    },
    {
      key: SettingsKey.displayStyle,
      label: t('im.layout'),
      children: (
        <Form.Item noStyle={true} name={SettingsKey.displayStyle}>
          <DisplayStyle />
        </Form.Item>
      ),
    },
    {
      key: SettingsKey.displaySort,
      label: t('im.sort'),
      children: (
        <Form.Item name={SettingsKey.displaySort} noStyle={true}>
          <DisplaySort options={sortOptions} />
        </Form.Item>
      ),
    },
    {
      key: SettingsKey.backgroundColor,
      label: t('im.image_background_color'),
      children: (
        <Form.Item name={SettingsKey.backgroundColor} noStyle={true}>
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
      key: SettingsKey.hoverShowImageDetail,
      label: t('im.show_detail_hover'),
      children: (
        <Form.Item name={SettingsKey.hoverShowImageDetail} noStyle={true}>
          <HoverDetail />
        </Form.Item>
      ),
    },
  ]

  const [viewerLabelWidth, onViewerResize] = useColumnWidth()
  const [generalLabelWidth, onGeneralResize] = useColumnWidth()

  const tabsItems: TabsProps['items'] = [
    {
      key: 'viewer',
      label: t('im.viewer'),
      children: (
        <AppearMotion>
          {viewerItems.map((item) => (
            <AlignColumn
              key={item.key}
              id={item.key}
              left={item.label}
              right={item.children}
              minWidth={viewerLabelWidth}
              onResize={onViewerResize}
            />
          ))}
        </AppearMotion>
      ),
    },
    {
      key: 'general',
      label: t('im.general'),
      children: (
        <AppearMotion>
          {generalItems.map((item) => (
            <AlignColumn
              key={item.key}
              id={item.key}
              left={item.label}
              right={item.children}
              minWidth={generalLabelWidth}
              onResize={onGeneralResize}
            />
          ))}
        </AppearMotion>
      ),
    },
  ]

  const [form] = Form.useForm()
  const { message } = App.useApp()
  const onFinish = useMemoizedFn((values) => {
    onClose()
    for (const key in values) {
      const value = values[key]
      if (!isNil(value)) {
        formStrategy[key].onChange(values[key])
      }
    }
    message.success(t('im.modify_success'))
  })

  return (
    <div className={'select-none'}>
      <Form form={form} onFinish={onFinish} initialValues={resolveInitialValues()}>
        <Tabs items={tabsItems} className={styles.tabs}></Tabs>
      </Form>
      <Divider className={'!my-4'} />
      <div className={'flex justify-end'}>
        <Button type={'primary'} onClick={form.submit}>
          {t('im.confirm')}
        </Button>
      </div>
    </div>
  )
}

export default memo(Settings)
