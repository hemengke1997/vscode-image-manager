import type { TabsProps } from 'antd'
import type { PrimaryColorPickerRef } from './components/primary-color-picker'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn, useTrackedEffect } from 'ahooks'
import { App, Button, Divider, Form, Space, Tabs, Typography } from 'antd'
import { isEqual, isNil } from 'es-toolkit'
import { some } from 'es-toolkit/compat'
import { useAtomValue } from 'jotai'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoLog } from 'react-icons/go'
import { MdBrowserUpdated } from 'react-icons/md'
import { author, version } from '~root/package.json'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import AlignColumn, { useColumnWidth } from '~/webview/image-manager/components/align-column'
import AppearMotion from '~/webview/image-manager/components/align-column/components/appear-motion'
import { useWorkspaceState } from '~/webview/image-manager/hooks/use-workspace-state'
import { GlobalAtoms } from '~/webview/image-manager/stores/global/global-store'
import {
  useDisplayGroup,
  useDisplayStyle,
  useHoverShowImageDetail,
  useImageBackgroundColor,
  useOriginLanguage,
  useOriginTheme,
  usePrimaryColor,
  useSort,
} from '~/webview/image-manager/stores/settings/hooks'
import { VscodeAtoms } from '~/webview/image-manager/stores/vscode/vscode-store'
import { Colors } from '~/webview/image-manager/utils/color'
import useChangelog from '../../use-changelog/use-changelog'
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
  const { closeModal } = props

  const { t, i18n } = useTranslation()

  const workspaceState = useAtomValue(VscodeAtoms.workspaceStateAtom)
  const extLastetInfo = useAtomValue(GlobalAtoms.extLatestInfoAtom)

  const [primaryColor, setPrimaryColor] = usePrimaryColor()
  const [originTheme] = useOriginTheme()
  const [, setTheme] = useOriginTheme()
  const [language, setLanguage] = useOriginLanguage()
  const [displayGroup, setDisplayGroup] = useDisplayGroup()
  const [displayStyle, setDisplayStyle] = useDisplayStyle()
  const [sort, setSort] = useSort()
  const [backgroundColor, setBackgroundColor] = useImageBackgroundColor()
  const [hoverShowImageDetail, setHoverShowImageDetail] = useHoverShowImageDetail()

  // 最近使用的主色
  const [recentPrimaryColors, setRecentPrimaryColors] = useWorkspaceState(
    WorkspaceStateKey.recent_primary_colors,
    workspaceState.recent_primary_colors,
  )

  const primaryColorRef = useRef<PrimaryColorPickerRef>(null)

  // 最近使用的图片背景色
  const [recentImageBackgroundColors, setRecentImageBackgroundColors] = useWorkspaceState(
    WorkspaceStateKey.recent_image_backgroundColors,
    workspaceState.recent_image_backgroundColors,
  )

  const imageBackgroundColorRef = useRef<PrimaryColorPickerRef>(null)

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
    {
      label: t('im.status_changed_time'),
      value: 'mtime',
    },
  ]

  const { showChangelog } = useChangelog()

  const viewerItems = [
    {
      key: SettingsKey.displayGroup,
      label: t('im.group'),
      children: (
        <Form.Item noStyle={true} name={SettingsKey.displayGroup}>
          <DisplayGroup />
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
            recentColors={recentImageBackgroundColors}
            onRecentColorsChange={setRecentImageBackgroundColors}
            extraColors={[Colors.warmBlack]}
            ref={imageBackgroundColorRef}
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
            ref={primaryColorRef}
            recentColors={recentPrimaryColors}
            onRecentColorsChange={setRecentPrimaryColors}
          />
        </Form.Item>
      ),
    },
  ]

  const aboutItems = [
    {
      key: 'version',
      label: t('im.version'),
      children: (
        <Space>
          <Typography.Text strong={true}>{version}</Typography.Text>
          {extLastetInfo?.version && extLastetInfo.version !== version && (
            <Button
              icon={<MdBrowserUpdated />}
              href='https://marketplace.visualstudio.com/items?itemName=minko.image-manager'
            >
              {t('im.upgrade')}
            </Button>
          )}
        </Space>
      ),
    },
    {
      key: 'github',
      label: t('im.source_code'),
      children: <Typography.Link href='https://github.com/hemengke1997/vscode-image-manager'>Github</Typography.Link>,
    },
    {
      key: 'author',
      label: t('im.author'),
      children: <Typography.Link href='https://github.com/hemengke1997'>{author}</Typography.Link>,
    },
    {
      key: 'changelog',
      label: t('im.changelog'),
      children: (
        <Button icon={<GoLog />} onClick={showChangelog}>
          {t('im.view')}
        </Button>
      ),
    },
  ]

  const formStrategy = {
    [SettingsKey.language]: {
      value: language,
      onChange: setLanguage,
    },
    [SettingsKey.theme]: {
      value: originTheme,
      onChange: setTheme,
    },
    [SettingsKey.primaryColor]: {
      value: primaryColor,
      onChange: (value: string) => {
        setPrimaryColor(value)
        primaryColorRef.current?.updateRecentColors(value)
      },
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
      onChange: (value: string) => {
        setBackgroundColor(value)
        imageBackgroundColorRef.current?.updateRecentColors(value)
      },
    },
    [SettingsKey.hoverShowImageDetail]: {
      value: hoverShowImageDetail,
      onChange: setHoverShowImageDetail,
    },
  }

  const [form] = Form.useForm()

  useTrackedEffect(
    (changes) => {
      changes?.forEach((index) => {
        const key = Object.keys(formStrategy)[index]
        form.setFieldsValue({
          [key]: formStrategy[key].value,
        })
      })
    },
    [...Object.values(formStrategy).map(t => t.value)],
  )

  const resolveInitialValues = useMemoizedFn(() => {
    const initialValues = {}
    for (const key in formStrategy) {
      initialValues[key] = formStrategy[key].value
    }
    return initialValues
  })

  const [viewerLabelWidth, onViewerResize] = useColumnWidth()
  const [generalLabelWidth, onGeneralResize] = useColumnWidth()
  const [aboutLabelWidth, onAboutResize] = useColumnWidth()

  const tabsItems: Array<
    Exclude<TabsProps['items'], undefined>[0] & {
      form?: boolean
    }
  > = [
    {
      key: 'viewer',
      label: t('im.viewer'),
      children: (
        <AppearMotion>
          {viewerItems.map(item => (
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
          {generalItems.map(item => (
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
    {
      key: 'about',
      label: t('im.about'),
      form: false,
      children: (
        <AppearMotion>
          {aboutItems.map(item => (
            <AlignColumn
              key={item.key}
              id={item.key}
              left={item.label}
              right={item.children}
              minWidth={aboutLabelWidth}
              onResize={onAboutResize}
            />
          ))}
        </AppearMotion>
      ),
    },
  ]

  const shouldShowMessage = useRef(false)

  const { message } = App.useApp()
  const onModifySuccess = useMemoizedFn(() => {
    message.success(t('im.modify_success'))
  })

  const onFinish = useMemoizedFn((values) => {
    closeModal()
    const changed: {
      [key in keyof typeof formStrategy]?: boolean
    } = {}
    for (const key in values) {
      const value = values[key]

      // 深对比
      if (!isEqual(value, formStrategy[key].value)) {
        changed[key] = true

        if (!isNil(value)) {
          formStrategy[key].onChange(values[key])
        }
      }
    }
    if (some(changed, t => !!t)) {
      if (changed[SettingsKey.language]) {
        // 在语言变化后在提示修改成功
        shouldShowMessage.current = true
      }
      else {
        // 直接提示
        onModifySuccess()
      }
    }
  })

  useEffect(() => {
    function event() {
      if (shouldShowMessage) {
        onModifySuccess()
        shouldShowMessage.current = false
      }
    }
    i18n.on('languageChanged', event)

    return () => {
      i18n.off('languageChanged', event)
    }
  }, [i18n])

  const [activeKey, setActiveKey] = useState<string>()

  return (
    <div className='select-none'>
      <Form form={form} onFinish={onFinish} initialValues={resolveInitialValues()}>
        <Tabs items={tabsItems} className={styles.tabs} activeKey={activeKey} onChange={setActiveKey}></Tabs>
      </Form>

      {tabsItems.find(t => t.key === activeKey)?.form === false
        ? null
        : (
            <>
              <Divider className='!my-4' />
              <div className='flex justify-end'>
                <Button type='primary' onClick={form.submit}>
                  {t('im.confirm')}
                </Button>
              </div>
            </>
          )}
    </div>
  )
}

export default memo(Settings)
