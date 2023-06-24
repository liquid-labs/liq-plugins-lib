import createError from 'http-errors'

import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { appInit } from '@liquid-labs/liq-core'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineRegistryData } from './lib/determine-registry-data'

const addPluginsHandler = ({ installedPlugins, pluginPkgDir }) => 
    ({ app, cache, model, reporter }) => async(req, res) => {
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
        || await determineRegistryData({ cache, registries: app.liq.serverSettings.registries })
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
    await appInit({ app, model, ...app.liq.config })
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

export { addPluginsHandler }
