import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { tryExec } from '@liquid-labs/shell-toolkit'

const removePluginsSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `remove ${pluginsDesc} plugins`,
    summary     : 'Removes the named plugin.',
    description : 'Removes the named plugin.'
  }

  const method = 'delete'

  const parameters = []

  return { help, method, parameters }
}

const removePluginsHandler = ({ installedPluginsRetriever, pluginPkgDir }) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const installedPlugins = installedPluginsRetriever({ app, model })
    const { pluginName } = req.vars

    const pluginData = installedPlugins.find(({ name }) => pluginName === name)
    if (!pluginData) {
      throw createError.NotFound(`No such plugin '${pluginName}' found.`)
    }
    // else

    const npmName = pluginData.npmName
    tryExec(`cd "${(pluginPkgDir)}" && npm uninstall ${npmName}`)

    await app.init({ app, model, ...app.liq.config })

    httpSmartResponse({ msg : `Removed '${pluginName}' plugin.`, req, res })
  }

export { removePluginsHandler, removePluginsSetup }
