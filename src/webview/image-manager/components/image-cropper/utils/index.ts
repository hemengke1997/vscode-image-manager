import { type i18n } from 'i18next'

export function getViewmodes(i18next: i18n) {
  return [
    {
      label: i18next.t('im.free'),
      value: 0,
    },
    {
      label: i18next.t('im.restrict'),
      value: 1,
    },
  ]
}

export function getAspectRatios(i18next: i18n) {
  return [
    {
      label: '16:9',
      value: 16 / 9,
    },
    {
      label: '4:3',
      value: 4 / 3,
    },
    {
      label: '1:1',
      value: 1,
    },
    {
      label: i18next.t('im.unset'),
      value: 0,
    },
  ]
}

export const DETAIL_MAP = {
  width: {
    label: 'Width',
    unit: 'px',
  },
  height: {
    label: 'Height',
    unit: 'px',
  },
  x: {
    label: 'X',
    unit: 'px',
  },
  y: {
    label: 'Y',
    unit: 'px',
  },
  rotate: {
    label: 'Rotate',
    unit: 'deg',
  },
  scaleX: {
    label: 'ScaleX',
    unit: '',
  },
  scaleY: {
    label: 'ScaleY',
    unit: '',
  },
}
