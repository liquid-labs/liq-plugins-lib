import { httpSmartResponse } from '@liquid-labs/http-smart-response'

import { determineRegistryData } from './lib/determine-registry-data'
import { selectMatchingPlugins } from './lib/select-matching-plugins'

import { installPlugins } from './lib/install-plugins'

const addPluginsSetup = ({ hostVersionRetriever, pluginType }) => {
  const help = {
    name        : `add ${pluginType} plugins`,
    summary     : `Installs one or more ${pluginType} plugins.`,
    description : `Installs one or more ${pluginType} plugins.`
  }
  const method = 'put'

  const parameters = [
    {
      name         : 'npmNames',
      isMultivalue : true,
      description  : 'The plugins to install, by their NPM package name. Include multiple times to install multiple plugins.',
      optionsFunc  : async({ app, model, cache }) => {
        if (app.ext.noRegistries === true) {
          return []
        }
        const hostVersion = hostVersionRetriever({ app, model })
        const registryData = await determineRegistryData({ cache, registries : app.ext.serverSettings.registries })
        const plugins = selectMatchingPlugins({ hostVersion, pluginType, registryData })
        return plugins.map(({ npmName }) => npmName)
      }
    }
  ]

  return { help, method, parameters }
}

const addPluginsHandler = ({
  hostVersionRetriever,
  installedPluginsRetriever,
  pluginPkgDirRetriever,
  pluginType,
  reloadFunc
}) =>
({ app, cache, model, reporter }) => async(req, res) => {
  const installedPlugins = installedPluginsRetriever({ app, model, reporter, req }) || []
  const { npmNames } = req.vars
  const hostVersion = hostVersionRetriever({ app, cache, model, reporter, req })
  const pluginPkgDir = pluginPkgDirRetriever({ app, reporter, req })

  const msg = await installPlugins({ 
    app,
    cache, 
    hostVersion, 
    installedPlugins, 
    npmNames, 
    pluginPkgDir, 
    pluginType, 
    reloadFunc, 
    reporter, 
    req, 
    res
  })

  httpSmartResponse({ msg, req, res })
}

export { addPluginsHandler, addPluginsSetup }
