import ImageManager from './image-manager'
import ActionContext from './image-manager/contexts/action-context'
import GlobalContext from './image-manager/contexts/global-context'
import SettingsContext from './image-manager/contexts/settings-context'
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

function mount(reload?: boolean) {
  registerApp(webviewComponents, reload)
}

window.mountApp = mount

mount()
