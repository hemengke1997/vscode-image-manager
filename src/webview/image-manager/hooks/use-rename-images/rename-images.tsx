import type { SegmentedOptions } from 'antd/es/segmented'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn } from 'ahooks'
import { Button, Divider, Form, Input, Segmented, Space } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { slashPath } from '~/utils'
import AutoFocusInput from '../../components/auto-focus-input'

interface Props {
  /**
   * 图片列表
   */
  images: ImageType[]
  /**
   * 选中的图片（作为示例）
   */
  selectedImage: ImageType
  /**
   * 表单提交回调
   */
  onSubmit: (files: { source: string, target: string }[]) => Promise<void>
}

enum RenameKey {
  // 模式，替换/添加
  mode = 'mode',
  // 查找字符串
  find = 'find',
  // 替换字符串
  replace = 'replace',
  // 添加
  add = 'add',
  // 添加字符串的位置
  position = 'position',
  // 添加在字符串之前
  position_before = 'position_before',
  // 添加在字符串之后
  position_after = 'position_after',
}

enum ModeOption {
  // 替换
  replace = 'replace',
  // 添加
  add = 'add',
}

interface FormValues {
  [RenameKey.mode]: ModeOption
  [ModeOption.replace]: {
    [RenameKey.find]: string
    [RenameKey.replace]: string
  }
  [ModeOption.add]: {
    [RenameKey.add]: string
    [RenameKey.position]: RenameKey.position_before | RenameKey.position_after
  }
}

function RenameImages(props: Props & ImperativeModalProps) {
  const { images, selectedImage, onSubmit, closeModal } = props

  const { t } = useTranslation()

  const selectedImageName = selectedImage.name

  const [form] = Form.useForm<FormValues>()

  const options: SegmentedOptions = [
    {
      label: t('im.replace_text'),
      value: ModeOption.replace,
    },
    {
      label: t('im.add_text'),
      value: ModeOption.add,
    },
  ]

  // 示例值
  const [eg, setEg] = useState(selectedImageName)

  const [submitStatus, setSubmitStatus] = useState<{
    disabled?: boolean
    loading?: boolean
  }>({
    disabled: true,
  })

  /**
   * 获取指定位置添加文本后的名称
   */
  const getPositionedName = useMemoizedFn(
    (name: string, added: string, position: RenameKey.position_before | RenameKey.position_after) => {
      switch (position) {
        case RenameKey.position_before:
          return `${added}${name}`
        case RenameKey.position_after:
          return `${name}${added}`
        default:
          return name
      }
    },
  )

  const strategy = {
    [ModeOption.replace]: (values: FormValues) => {
      const find = values[ModeOption.replace][RenameKey.find] || ''
      const replace = values[ModeOption.replace][RenameKey.replace] || ''
      return {
        // 更新示例
        updateEg: () => {
          setEg(selectedImageName.replace(find, replace))
        },
        // 更新按钮禁用状态
        updateSubmitDisabled: () => {
          setSubmitStatus({
            // 查找和替换都空时，禁用提交按钮
            disabled: !find && !replace,
          })
        },
        // 处理提交
        onSubmit: async () => {
          setSubmitStatus({
            loading: true,
          })
          // 把当前所有图片都进行重命名
          const files = images.map((image) => {
            const newName = image.name.replace(find, replace)
            return {
              source: image.path,
              target: slashPath(`${image.absDirPath}/${newName}.${image.extname}`),
            }
          })
          try {
            await onSubmit(files)
            closeModal()
          }
          finally {
            setSubmitStatus({
              loading: false,
            })
          }
        },
      }
    },
    [ModeOption.add]: (values: FormValues) => {
      const added = values[ModeOption.add][RenameKey.add] || ''
      const position = values[ModeOption.add][RenameKey.position]
      return {
        updateEg: () => {
          return getPositionedName(selectedImageName, added, position)
        },
        updateSubmitDisabled: () => {
          setSubmitStatus({
            disabled: !added,
          })
        },
        onSubmit: async () => {
          setSubmitStatus({
            loading: true,
          })
          // 把当前所有图片都进行重命名
          const files = images.map((image) => {
            const newName = getPositionedName(image.name, added, position)
            return {
              source: image.path,
              target: slashPath(`${image.absDirPath}/${newName}.${image.extname}`),
            }
          })
          try {
            await onSubmit(files)
            closeModal()
          }
          finally {
            setSubmitStatus({
              loading: false,
            })
          }
        },
      }
    },
  }

  const onValuesChangeNextTick = useMemoizedFn(() => {
    // 到下一次微任务执行时才能获取到最新的form值
    Promise.resolve().then(() => {
      const values = form.getFieldsValue()

      const current = strategy[values[RenameKey.mode]](values)
      current.updateEg()
      current.updateSubmitDisabled()
    })
  })

  return (
    <Form
      name='rename-images'
      initialValues={{
        [RenameKey.mode]: ModeOption.replace,
        [RenameKey.add]: {
          [RenameKey.position]: RenameKey.position_before,
        },
      }}
      preserve={true}
      form={form}
      onValuesChange={onValuesChangeNextTick}
      onFinish={async (values) => {
        await strategy[values[RenameKey.mode]](values).onSubmit()
      }}
    >
      <Form.Item name={RenameKey.mode} noStyle={true}>
        <Segmented options={options} className='my-4'></Segmented>
      </Form.Item>
      <Form.Item noStyle={true} shouldUpdate={(prev, cur) => prev[RenameKey.mode] !== cur[RenameKey.mode]}>
        {({ getFieldValue }) => {
          const mode = getFieldValue(RenameKey.mode)
          switch (mode) {
            case ModeOption.replace:
              return (
                <div className='flex w-full justify-between'>
                  <Form.Item label={t('im.search')} name={[ModeOption.replace, RenameKey.find]}>
                    <AutoFocusInput className='w-56'></AutoFocusInput>
                  </Form.Item>
                  <Form.Item label={t('im.replace_to')} name={[ModeOption.replace, RenameKey.replace]}>
                    <Input className='w-56'></Input>
                  </Form.Item>
                </div>
              )
            case ModeOption.add:
              return (
                <div className='flex items-center justify-between'>
                  <Form.Item name={[ModeOption.add, RenameKey.add]} className='mr-4 flex-1'>
                    <AutoFocusInput className='w-full' />
                  </Form.Item>
                  <Form.Item name={[ModeOption.add, RenameKey.position]}>
                    <Segmented
                      size='small'
                      options={[
                        {
                          label: t('im.before_filename'),
                          value: RenameKey.position_before,
                        },
                        {
                          label: t('im.after_filename'),
                          value: RenameKey.position_after,
                        },
                      ]}
                    >
                    </Segmented>
                  </Form.Item>
                </div>
              )
            default:
              break
          }
        }}
      </Form.Item>
      <Divider className='mb-6 mt-2' />
      <div className='flex justify-between'>
        <div>
          {t('im.eg')}
          {eg}
        </div>
        <Space>
          <Button
            onClick={() => {
              closeModal()
            }}
          >
            {t('im.cancel')}
          </Button>
          <Button type='primary' {...submitStatus} htmlType='submit'>
            {t('im.rename')}
          </Button>
        </Space>
      </div>
    </Form>
  )
}

export default memo(RenameImages)
