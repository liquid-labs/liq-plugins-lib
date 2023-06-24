import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'

const detailsPluginHandler = ({ installedPlugins }) => 
    ({ app, cache, model, reporter }) => async(req, res) => {
  const { pluginName } = req.vars

  const pluginData = installedPlugins.find(({ name }) => pluginName === name)
  if (!pluginData) {
    throw createError.NotFound(`No such plugin '${pluginName}' found.`)
  }
  // else

  httpSmartResponse({ data : pluginData, req, res })
}

export { detailsPluginHandler }
