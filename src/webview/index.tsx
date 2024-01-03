import ImageManager from './ImageManager'
import ImageManagerContext from './ImageManager/contexts/ImageManagerContext'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageManagerPanel: () => (
    <ImageManagerContext.Provider>
      <ImageManager />
    </ImageManagerContext.Provider>
  ),
}

registerApp(webviewComponents)
