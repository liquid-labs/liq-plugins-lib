import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineRegistryData } from './lib/determine-registry-data'
import { selectMatchingPlugins } from './lib/select-matching-plugins'

const addPluginsSetup = ({ hostVersionRetriever, pluginsDesc, pluginType }) => {
  const help = {
    name        : `add ${pluginsDesc} plugins`,
    summary     : `Installs one or more ${pluginsDesc} plugins.`,
    description : `Installs one or more ${pluginsDesc} plugins.`
  }
  const method = 'put'

  const parameters = [
    {
      name         : 'npmNames',
      isMultivalue : true,
      description  : 'The plugins to install, by their NPM package name. Include multiple times to install multiple plugins.',
      optionsFunc  : async({ app, model, cache }) => {
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
  pluginsDesc,
  pluginType,
  reloadFunc
}) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const installedPlugins = installedPluginsRetriever({ app, model, reporter, req }) || []
    const { npmNames } = req.vars
    const hostVersion = hostVersionRetriever({ app, cache, model, reporter, req })

    let registryData // this functions as a cache, filled as needed
    const alreadyInstalled = []
    const devInstalls = []
    const prodInstalls = []
    for (const testName of npmNames) {
      let matched = installedPlugins.some(({ npmName }) => {
        return npmName === testName
      })
      if (matched === true) {
        alreadyInstalled.push(testName)
        continue
      }

      // is it a development package? Notice, we don't check our registry because these might not be registered
      for (const projectSpec of model.playground.projects.list({ rawData : true })) {
        if (testName === projectSpec.packageJSON?.name) {
          devInstalls.push('file:' + projectSpec.localProjectPath)
          matched = true
          break
        }
      }

      if (matched === false) {
        registryData = registryData
          || await determineRegistryData({ cache, registries : app.ext.serverSettings.registries })

        const plugins = selectMatchingPlugins({ hostVersion, pluginType, registryData })

        if (!plugins.some(({ npmName }) => npmName === testName)) {
          throw createError.NotFound(`No such plugin package '${testName}' found in the registries.`)
        }
        prodInstalls.push(testName)
      }
    }

    const prodInstalled = prodInstalls.length > 0
    const devInstalled = devInstalls.length > 0
    const anyInstalled = prodInstalled || devInstalled

    let msg =
      (anyInstalled
        ? '<em>Installed<rst> <code>'
          + ((devInstalled
            ? devInstalls.join('<rst>, <code>') + '<rst> development packages'
            : (prodInstalled ? ' and <code>' : '')))
            + (prodInstalled ? prodInstalls.join('<rst>, <code>') + '<rst> production packages' : '')
        : 'Nothing installed')
      + (alreadyInstalled.length > 0
        ? (anyInstalled ? '; <code>' : '')
            + alreadyInstalled.join('<rst>, <code>') + '<rst> packages already installed'
        : '')

    const pluginPkgDir = pluginPkgDirRetriever({ app, model, reporter, req })
    const pluginPkg = fsPath.join(pluginPkgDir, 'package.json')
    if (!fs.existsSync(pluginPkg)) {
      fs.mkdirSync(pluginPkgDir, { recursive : true })
      fs.writeFileSync(pluginPkg, '{}')
    }

    if (anyInstalled === true) {
      tryExec(`cd "${pluginPkgDir}" && npm install ${prodInstalls.join(' ')} ${devInstalls.join(' ')}`)
      if (reloadFunc !== undefined) {
        const reload = reloadFunc({ app, cache, model, reporter, req })
        if (reload.then) {
          await reload
        }
      }
      msg += `; ${pluginsDesc} plugins reloaded.`
    }
    else {
      msg += '.'
    }

    httpSmartResponse({ msg, req, res })
  }

export { addPluginsHandler, addPluginsSetup }
