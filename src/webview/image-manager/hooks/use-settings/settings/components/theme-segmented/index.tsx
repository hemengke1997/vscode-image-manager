import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md'
import { VscColorMode } from 'react-icons/vsc'
import { Segmented } from 'antd'
import { Theme } from '~/meta'
import styles from './index.module.css'

type Props = {
  value?: Theme
  onChange?: (theme: Theme) => void
}

function ThemeSegmented(props: Props) {
  const { value, onChange } = props

  const { t } = useTranslation()

  const themes: {
    value: Theme
    icon: JSX.Element
    label: string
  }[] = [
    {
      value: Theme.light,
      icon: <MdOutlineLightMode />,
      label: t('im.light'),
    },
    {
      value: Theme.dark,
      icon: <MdOutlineDarkMode />,
      label: t('im.dark'),
    },
    {
      value: Theme.auto,
      icon: <VscColorMode />,
      label: t('im.auto'),
    },
  ]

  return (
    <Segmented
      options={themes.map((t) => ({
        value: t.value,
        label: t.label,
        icon: <span className={'inline-flex text-lg'}>{t.icon}</span>,
      }))}
      value={value}
      className={styles.segmented}
      onChange={onChange}
    />
  )
}

export default memo(ThemeSegmented)
