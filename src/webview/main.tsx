import ImageManager from './ImageManager'
import ActionContext from './ImageManager/contexts/ActionContext'
import GlobalContext from './ImageManager/contexts/GlobalContext'
import SettingsContext from './ImageManager/contexts/SettingsContext'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageManagerPanel: () => (
    <GlobalContext.Provider>
      <SettingsContext.Provider>
        <ActionContext.Provider>
          <ImageManager />
        </ActionContext.Provider>
      </SettingsContext.Provider>
    </GlobalContext.Provider>
  ),
}

registerApp(webviewComponents)
