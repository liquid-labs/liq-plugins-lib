import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'

const detailsPluginSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `${pluginsDesc} plugins details`,
    summary     : 'Provides details on the named plugin.',
    description : 'Provides details on the named plugin.'
  }
  const method = 'get'

  const parameters = []

  return { help, method, parameters }
}

const detailsPluginHandler = ({ installedPluginsRetriever, nameKey }) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const installedPlugins = installedPluginsRetriever({ app, model, req })
    const pluginName = req.vars[nameKey]

    const pluginData = installedPlugins.find(({ name }) => pluginName === name)
    if (!pluginData) {
      throw createError.NotFound(`No such plugin '${pluginName}' found.`)
    }
    // else

    httpSmartResponse({ data : pluginData, req, res })
  }

export { detailsPluginHandler, detailsPluginSetup }
