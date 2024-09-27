import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { App, Button, ConfigProvider, Divider, Form, InputNumber, Segmented } from 'antd'
import { isNil } from 'lodash-es'
import { defaultState } from '~/core/persist/workspace/common'
import AlignColumn, { useColumnWidth } from '../../components/align-column'
import FilterContext from '../../contexts/filter-context'
import { type ImperativeModalProps } from '../use-imperative-modal'
import DisplayType from './components/display-type'

export const enum FilterRadioValue {
  all = 0,
  yes = 1,
  no = 2,
}

export type ImageFilterType = {
  /**
   * 排除显示图片类型
   */
  exclude_types: string[]
  /**
   * 图片体积
   */
  size: {
    min?: number
    max?: number
  }
  /**
   * 0: all, 1: yes, 2: no
   */
  git_staged: ValueOf<typeof FilterRadioValue>
  /**
   * 0: all, 1: yes, 2: no
   */
  compressed: ValueOf<typeof FilterRadioValue>
}

export enum ImageVisibleFilter {
  exclude_types = 'exclude_types',
  size = 'size',
  git_staged = 'git_staged',
  compressed = 'compressed',
}

function ImageFilter(props: ImperativeModalProps) {
  const { onClose } = props
  const { t } = useTranslation()
  const { message } = App.useApp()

  const { imageFilter, setImageFilter } = FilterContext.usePicker(['imageFilter', 'setImageFilter'])

  const [form] = Form.useForm<ImageFilterType>()

  const filterItems = [
    {
      key: ImageVisibleFilter.exclude_types,
      label: t('im.type'),
      children: (
        <Form.Item name={ImageVisibleFilter.exclude_types}>
          <DisplayType />
        </Form.Item>
      ),
    },
    {
      key: ImageVisibleFilter.size,
      label: t('im.size'),
      children: (
        <Form.Item>
          <div className={'flex flex-col items-center gap-2'}>
            <Form.Item
              noStyle
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const max = getFieldValue([ImageVisibleFilter.size, 'max'])
                    if (!isNil(max) && !isNil(value) && value > max) {
                      return Promise.reject(new Error(t('im.size_filter_tip')))
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
              name={[ImageVisibleFilter.size, 'min']}
              dependencies={[[ImageVisibleFilter.size, 'max']]}
            >
              <InputNumber size={'middle'} placeholder={`${t('im.min')}`} min={0} addonAfter={'KB'} />
            </Form.Item>
            <Form.Item
              noStyle
              name={[ImageVisibleFilter.size, 'max']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const min = getFieldValue([ImageVisibleFilter.size, 'min'])
                    if (!isNil(min) && !isNil(value) && value < min) {
                      return Promise.reject()
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
              dependencies={[[ImageVisibleFilter.size, 'min']]}
            >
              <InputNumber size={'middle'} placeholder={`${t('im.max')}`} min={0} addonAfter={'KB'} />
            </Form.Item>
          </div>
        </Form.Item>
      ),
    },
    {
      key: ImageVisibleFilter.git_staged,
      label: t('im.git_staged'),
      children: (
        <Form.Item name={ImageVisibleFilter.git_staged}>
          <Segmented
            options={[
              {
                value: FilterRadioValue.all,
                label: t('im.all'),
              },
              {
                value: FilterRadioValue.yes,
                label: t('im.yes'),
              },
              {
                value: FilterRadioValue.no,
                label: t('im.no'),
              },
            ]}
          ></Segmented>
        </Form.Item>
      ),
    },
    {
      key: ImageVisibleFilter.compressed,
      label: t('im.compressed'),
      children: (
        <Form.Item name={ImageVisibleFilter.compressed}>
          <Segmented
            options={[
              {
                value: FilterRadioValue.all,
                label: t('im.all'),
              },
              {
                value: FilterRadioValue.yes,
                label: t('im.yes'),
              },
              {
                value: FilterRadioValue.no,
                label: t('im.no'),
              },
            ]}
          ></Segmented>
        </Form.Item>
      ),
    },
  ]

  const [filterLabelWidth, onFilterResize] = useColumnWidth()

  const onFinish = useMemoizedFn((value) => {
    onClose()
    setImageFilter(value)
    message.success(t('im.operation_success'))
  })

  return (
    <ConfigProvider
      theme={{
        components: {
          Form: {
            itemMarginBottom: 0,
          },
        },
      }}
    >
      <Form form={form} onFinish={onFinish} className={'flex flex-col gap-4'} initialValues={imageFilter}>
        {filterItems.map((item) => (
          <AlignColumn
            key={item.key}
            id={item.key}
            left={item.label}
            right={item.children}
            minWidth={filterLabelWidth}
            onResize={onFilterResize}
          />
        ))}
      </Form>
      <Divider className={'!my-4'}></Divider>
      <div className={'flex w-full justify-end gap-x-2'}>
        <Button
          type='default'
          onClick={() => {
            form.setFieldsValue(defaultState.image_filter)
            form.submit()
          }}
        >
          {t('im.reset')}
        </Button>
        <Button type='primary' onClick={form.submit}>
          {t('im.confirm')}
        </Button>
      </div>
    </ConfigProvider>
  )
}

export default memo(ImageFilter)
