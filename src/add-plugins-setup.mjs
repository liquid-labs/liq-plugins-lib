import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineRegistryData } from './lib/determine-registry-data'

const addPluginsSetup = ({ pluginsDesc }) => {
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
      optionsFunc  : async({ app, cache }) => {
        // TODO: look for makrers in packaeg.json and incorproate development packages as well?
        const registryData = await determineRegistryData({ cache, registries : app.liq.serverSettings.registries })
        return registryData.reduce((acc, { plugins }) => acc.push(plugins.map(({ npmName }) => npmName)))
      }
    }
  ]

  return { help, method, parameters }
}

const addPluginsHandler = ({ installedPluginsRetriever, pluginPkgDir }) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const installedPlugins = installedPluginsRetriever({ app, model })
    const { npmNames } = req.vars

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

      // is it a development package? Notice, we don't check our registry unless we have to
      for (const projectSpec of Object.values(model.playground.projects)) {
        if (testName === projectSpec.packageJSON?.name) {
          devInstalls.push('file:' + projectSpec.localProjectPath)
          matched = true
          break
        }
      }

      if (matched === false) {
        registryData = registryData
      || await determineRegistryData({ cache, registries : app.liq.serverSettings.registries })
        if (!Object.values(registryData).some(({ plugins }) => plugins.some(({ npmName }) => npmName === testName))) {
          throw createError.NotFound(`No such plugin package '${testName}' found in the registries.`)
        }
        prodInstalls.push(testName)
      }
    }

    const prodInstalled = prodInstalls.length > 0
    const devInstalled = devInstalls.length > 0
    const anyInstalled = prodInstalled || devInstalled

    if (anyInstalled === true) {
      tryExec(`cd "${pluginPkgDir}" && npm install ${prodInstalls.join(' ')} ${devInstalls.join(' ')}`)
      await app.init({ app, model, ...app.liq.config })
    }

    const msg =
  +(anyInstalled
    ? 'Installed '
    : ((devInstalled
      ? devInstalls.join(', ') + 'development packages'
      : (prodInstalled ? ' and ' : '')))
      + (prodInstalled ? prodInstalls.join(', ' + 'production packages') : ''))
  + (alreadyInstalled.length > 0
    ? (anyInstalled ? '; ' : '')
        + alreadyInstalled.join(', ') + ' packages already installed'
    : '')
  + '.'
    httpSmartResponse({ msg, req, res })
  }

export { addPluginsHandler, addPluginsSetup }
