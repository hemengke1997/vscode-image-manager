type CropperImageOptions = {
  [key: string]: unknown
} & Cropper.Options<HTMLImageElement>

type CropperKeys = keyof Cropper.Options

const cropperProps: Array<CropperKeys> = [
  'aspectRatio',
  'autoCrop',
  'autoCropArea',
  'background',
  'center',
  'checkCrossOrigin',
  'checkOrientation',
  'cropBoxMovable',
  'cropBoxResizable',
  'data',
  'dragMode',
  'guides',
  'highlight',
  'initialAspectRatio',
  'minCanvasHeight',
  'minCanvasWidth',
  'minContainerHeight',
  'minContainerWidth',
  'minCropBoxHeight',
  'minCropBoxWidth',
  'modal',
  'movable',
  'preview',
  'responsive',
  'restore',
  'rotatable',
  'scalable',
  'toggleDragModeOnDblclick',
  'viewMode',
  'wheelZoomRatio',
  'zoomOnTouch',
  'zoomOnWheel',
  'zoomable',
  'cropstart',
  'cropmove',
  'cropend',
  'crop',
  'zoom',
  'ready',
]

export function cleanImageProps(imageProps: CropperImageOptions) {
  return cropperProps.reduce((acc, key) => {
    const { [key]: _, ...rest } = acc
    return rest
  }, imageProps)
}
