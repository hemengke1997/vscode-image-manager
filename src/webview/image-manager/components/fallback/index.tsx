import { memo } from 'react'
import { type FallbackProps } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'
import { MdOutlineError } from 'react-icons/md'
import { Button, Result, Tooltip, Typography } from 'antd'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'

const { Paragraph, Text } = Typography

function Fallback(props: FallbackProps) {
  const { error, resetErrorBoundary } = props
  const { t } = useTranslation()

  return (
    <div role='alert' className={'h-screen select-text'}>
      <Result status='error' title={t('fallback.internal_error')} subTitle={<>{t('fallback.sorry')} 😥</>}>
        <Paragraph>
          <Text strong className={'text-lg'}>
            {t('fallback.error_msg')}
          </Text>
        </Paragraph>
        <div className={'flex space-x-2'}>
          <MdOutlineError className='mt-0.5 text-lg text-ant-color-error' />
          <Paragraph
            ellipsis={{
              rows: 5,
              expandable: true,
              symbol: t('fallback.show_more'),
            }}
          >
            <span>{error.message}</span>
          </Paragraph>
        </div>

        <div className={'flex justify-center space-x-4'}>
          <Button
            size='middle'
            type='primary'
            onClick={() => {
              resetErrorBoundary()
            }}
          >
            {t('fallback.restart')}
          </Button>

          <Tooltip title={t('fallback.reset_tip')}>
            <Button
              size='middle'
              danger
              onClick={() => {
                vscodeApi.postMessage({ cmd: CmdToVscode.clear_workspace_state }, () => {
                  resetErrorBoundary()
                })
              }}
            >
              {t('fallback.reset')}
            </Button>
          </Tooltip>

          <Tooltip title={`${t('fallback.thx_report')}🙏`}>
            <a href='https://github.com/hemengke1997/vscode-image-manager/issues/new'>
              <Button
                size='middle'
                type='default'
                onClick={() => {
                  navigator.clipboard.writeText(error.message)
                }}
              >
                {t('fallback.report')}
              </Button>
            </a>
          </Tooltip>
        </div>
      </Result>
    </div>
  )
}

export default memo(Fallback)
