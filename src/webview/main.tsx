import { ErrorBoundary } from 'react-error-boundary'
import ImageManager from './image-manager'
import AntdConfigProvider from './image-manager/components/antd-config-provider'
import Fallback from './image-manager/components/fallback'
import ActionContext from './image-manager/contexts/action-context'
import CtxMenuContext from './image-manager/contexts/ctx-menu-context'
import FilterContext from './image-manager/contexts/filter-context'
import GlobalContext from './image-manager/contexts/global-context'
import SettingsContext from './image-manager/contexts/settings-context'
import { registerApp } from './ui-framework/src/main'

function mount(reload?: boolean) {
  registerApp(
    <GlobalContext.Provider>
      <SettingsContext.Provider>
        <FilterContext.Provider>
          <ActionContext.Provider>
            <CtxMenuContext.Provider>
              <AntdConfigProvider>
                <ErrorBoundary FallbackComponent={Fallback}>
                  <ImageManager />
                </ErrorBoundary>
              </AntdConfigProvider>
            </CtxMenuContext.Provider>
          </ActionContext.Provider>
        </FilterContext.Provider>
      </SettingsContext.Provider>
    </GlobalContext.Provider>,
    reload,
  )
}

window.mountApp = mount

mount()
