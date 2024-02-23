import ImageManager from './ImageManager'
import ActionContext from './ImageManager/contexts/ActionContext'
import CroppoerContext from './ImageManager/contexts/CropperContext'
import GlobalContext from './ImageManager/contexts/GlobalContext'
import OperatorContext from './ImageManager/contexts/OperatorContext'
import SettingsContext from './ImageManager/contexts/SettingsContext'
import { registerApp } from './ui-framework/src/main'

const webviewComponents = {
  // key <===> viewType
  ImageManagerPanel: () => (
    <GlobalContext.Provider>
      <SettingsContext.Provider>
        <OperatorContext.Provider>
          <ActionContext.Provider>
            <CroppoerContext.Provider>
              <ImageManager />
            </CroppoerContext.Provider>
          </ActionContext.Provider>
        </OperatorContext.Provider>
      </SettingsContext.Provider>
    </GlobalContext.Provider>
  ),
}

mount()

export function mount(reload?: boolean) {
  registerApp(webviewComponents, reload)
}
