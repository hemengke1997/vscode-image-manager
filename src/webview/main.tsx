import ImageManager from './ImageManager'
import ImageManagerContext from './ImageManager/contexts/ImageManagerContext'
import SettingsContext from './ImageManager/contexts/SettingsContext'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageManagerPanel: () => (
    <ImageManagerContext.Provider>
      <SettingsContext.Provider>
        <ImageManager />
      </SettingsContext.Provider>
    </ImageManagerContext.Provider>
  ),
}

registerApp(webviewComponents)
