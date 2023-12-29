import ImageAnalysor from './ImageAnalysor'
import ImageAnalysorContext from './ImageAnalysor/context/ImageAnalysorContext'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageAnalysorPanel: () => (
    <ImageAnalysorContext.Provider>
      <ImageAnalysor />
    </ImageAnalysorContext.Provider>
  ),
}

registerApp(webviewComponents)
