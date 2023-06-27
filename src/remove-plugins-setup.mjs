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

const removePluginsHandler = ({ installedPluginsRetriever, nameKey, pluginPkgDirRetriever, reloadFunc }) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const installedPlugins = installedPluginsRetriever({ app, model, req })
    const pluginName = req.vars[nameKey]

    const pluginData = installedPlugins.find(({ name }) => pluginName === name)
    if (!pluginData) {
      throw createError.NotFound(`No such plugin '${pluginName}' found.`)
    }
    // else

    const npmName = pluginData.npmName
    const pluginPkgDir = pluginPkgDirRetriever({ app, model, reporter, req })
    tryExec(`cd "${(pluginPkgDir)}" && npm uninstall ${npmName}`)

    if (reloadFunc !== undefined) {
      const reload = reloadFunc({ app, cache, model, reporter, req })
      if (reload.then) {
        await reload
      }
    }

    httpSmartResponse({ msg : `<em>Removed<rst> <code>${pluginName}<rst> plugin. Server endpoints refreshed.`, req, res })
  }

export { removePluginsHandler, removePluginsSetup }
