import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { appInit } from '@liquid-labs/liq-core'
import { tryExec } from '@liquid-labs/shell-toolkit'

const removePluginsHandler = ({ installedPlugins, pluginPkgDir }) => 
    ({ app, cache, model, reporter }) => async(req, res) => {
  const { pluginName } = req.vars

  const pluginData = installedPluginsfind(({ name }) => pluginName === name)
  if (!pluginData) {
    throw createError.NotFound(`No such plugin '${pluginName}' found.`)
  }
  // else

  const npmName = pluginData.npmName
  tryExec(`cd "${(pluginPkgDir)}" && npm uninstall ${npmName}`)

  await appInit({ app, model, ...app.liq.config })

  httpSmartResponse({ msg : `Removed '${pluginName}' plugin.`, req, res })
}

export { removePluginsHandler }
