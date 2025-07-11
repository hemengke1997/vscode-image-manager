// Source from react-cropper
// Support hmr for better DX

import Cropper from 'cropperjs'
import React, { memo, useEffect, useRef } from 'react'
import { cleanImageProps } from './utils'

const REQUIRED_IMAGE_STYLES = { opacity: 0, maxWidth: '100%' }

type ReactCropperElement = {
  cropper: Cropper
} & HTMLImageElement

type ReactCropperRef
  = | ((instance: HTMLImageElement | ReactCropperElement | null) => void)
    | React.MutableRefObject<HTMLImageElement | ReactCropperElement | null>
    | null

type ReactCropperDefaultOptions = {
  scaleX?: number
  scaleY?: number
  enable?: boolean
  zoomTo?: number
  rotateTo?: number
}

type ReactCropperProps = {
  crossOrigin?: '' | 'anonymous' | 'use-credentials' | undefined
  on?: (eventName: string, callback: () => void | Promise<void>) => void | Promise<void>
  onInitialized?: (instance: Cropper) => void | Promise<void>
  forceRender?: number | string
} & ReactCropperDefaultOptions & Cropper.Options<HTMLImageElement> & Omit<React.HTMLProps<HTMLImageElement>, 'data' | 'ref' | 'crossOrigin'>

function applyDefaultOptions(cropper: Cropper, options: ReactCropperDefaultOptions = {}): void {
  const { enable = true, scaleX = 1, scaleY = 1, zoomTo = 0, rotateTo } = options
  enable ? cropper.enable() : cropper.disable()
  cropper.scaleX(scaleX)
  cropper.scaleY(scaleY)
  rotateTo !== undefined && cropper.rotateTo(rotateTo)
  zoomTo > 0 && cropper.zoomTo(zoomTo)
}

/**
 * sourced from: https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
 */
function useCombinedRefs(...refs: ReactCropperRef[]): React.RefObject<ReactCropperElement> {
  const targetRef = useRef<ReactCropperElement>(null)

  React.useEffect(() => {
    refs.forEach((ref) => {
      if (!ref)
        return

      if (typeof ref === 'function') {
        ref(targetRef.current)
      }
      else {
        ref.current = targetRef.current
      }
    })
  }, [refs])

  return targetRef
}

const ReactCropper = React.forwardRef<ReactCropperElement | HTMLImageElement, ReactCropperProps>(
  ({ ...props }, ref) => {
    const {
      dragMode = 'crop',
      src,
      style,
      className,
      crossOrigin,
      scaleX,
      scaleY,
      enable,
      zoomTo,
      rotateTo,
      alt = 'picture',
      ready,
      onInitialized,
      forceRender,
      ...rest
    } = props
    const defaultOptions: ReactCropperDefaultOptions = { scaleY, scaleX, enable, zoomTo, rotateTo }
    const innerRef = useRef<HTMLImageElement>(null)
    const combinedRef = useCombinedRefs(ref, innerRef)
    /**
     * Invoke zoomTo method when cropper is set and zoomTo prop changes
     */
    useEffect(() => {
      if (combinedRef.current?.cropper && typeof zoomTo === 'number') {
        combinedRef.current.cropper.zoomTo(zoomTo)
      }
    }, [props.zoomTo])

    /**
     * re-render when src changes
     */
    useEffect(() => {
      if (combinedRef.current?.cropper && typeof src !== 'undefined') {
        combinedRef.current.cropper.reset().clear().replace(src)
      }
    }, [src])

    const cropBoxData = combinedRef.current?.cropper?.getCropBoxData()
    const canvasData = combinedRef.current?.cropper?.getCanvasData()
    const data = combinedRef.current?.cropper.getData()

    useEffect(() => {
      if (combinedRef.current !== null) {
        const cropper = new Cropper(combinedRef.current, {
          dragMode,
          ...rest,
          ready: (e) => {
            if (e.currentTarget !== null) {
              applyDefaultOptions(e.currentTarget.cropper, defaultOptions)
            }
            if (cropBoxData && canvasData) {
              e.currentTarget.cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData).setData(data!)
            }

            ready && ready(e)
          },
        })

        onInitialized && onInitialized(cropper)
      }

      /**
       * destroy cropper on un-mount
       */
      return () => {
        combinedRef.current?.cropper?.destroy()
      }
    }, [combinedRef, forceRender])

    const imageProps = cleanImageProps({ ...rest, crossOrigin, src, alt })

    return (
      <div style={style} className={className}>
        <img {...imageProps} style={REQUIRED_IMAGE_STYLES} ref={combinedRef} />
      </div>
    )
  },
)

export default memo(ReactCropper)

export { ReactCropperElement, ReactCropperProps }
