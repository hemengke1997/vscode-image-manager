import ImageAnalysor from './ImageAnalysor'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageAnalysorPanel: ImageAnalysor,
}

registerApp(webviewComponents)
