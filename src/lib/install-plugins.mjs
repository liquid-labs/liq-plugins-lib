import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import createError from 'http-errors'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { determineRegistryData } from './determine-registry-data'
import { selectMatchingPlugins } from './select-matching-plugins'

const installPlugins = async({ 
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
}) => {
  let registryData // this functions as a cache, filled as needed
  const alreadyInstalled = []
  const devInstalls = []
  const prodInstalls = []
  for (const testPackage of npmNames) {
    // the 'npmNames' can be unqualified or can contain a version qualifier at the end, in which case we want to 
    // separate out the plain name part
    const testName = testPackage.replace(/(.)@.*/, '$1')

    let matched = installedPlugins.some(({ npmName }) => {
      return npmName === testName
    })
    if (matched === true) {
      alreadyInstalled.push(testName)
      continue
    }

    // is it a development package?
    const { projectPath } = app.ext._liqProjects?.playgroundMonitor?.getProjectData(testName) || {}
    if (projectPath !== undefined) {
      devInstalls.push('file:' + projectPath)
      matched = true
    }

    if (matched === false) {
      registryData = registryData
        || await determineRegistryData({ cache, registries : app.ext.serverSettings.registries })

      const plugins = selectMatchingPlugins({ hostVersion, pluginType, registryData })

      if (!plugins.some(({ npmName }) => npmName === testName)) {
        throw createError.NotFound(`No such plugin package '${testName}' found in the registries.`)
      }
      prodInstalls.push(testPackage) // keep the version qualifier, if any
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
      : `Nothing installed for <em>${pluginType}<rst>.`)
    + (alreadyInstalled.length > 0
      ? '\n<code>' + alreadyInstalled.join('<rst>, <code>') + '<rst> packages already installed'
      : '')

  const pluginPkg = fsPath.join(pluginPkgDir, 'package.json')
  if (!fs.existsSync(pluginPkg)) {
    fs.mkdirSync(pluginPkgDir, { recursive : true })
    fs.writeFileSync(pluginPkg, '{}')
  }

  if (anyInstalled === true) {
    tryExec(`cd "${pluginPkgDir}" && npm install ${prodInstalls.join(' ')} ${devInstalls.join(' ')}`)
    if (reloadFunc !== undefined) {
      const reload = reloadFunc({ app })
      if (reload.then) {
        await reload
      }
    }
    msg += `; ${pluginType} plugins reloaded.`
  }
  else {
    msg += '.'
  }

  return msg
}

export { installPlugins }
