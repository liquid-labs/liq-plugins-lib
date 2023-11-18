import * as fs from 'node:fs/promises'

import { determineRegistryData } from './determine-registry-data'
import { selectMatchingSeries } from './select-matching-series'
import { determineInstallationOrder } from './determine-installation-order'

import { install } from '@liquid-labs/npm-toolkit'

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
  const alreadyInstalled = []
  const toInstall = []
  for (const testPackage of npmNames) {
    // the 'npmNames' can be unqualified or can contain a version qualifier at the end, in which case we want to
    // separate out the plain name part
    const testName = testPackage.replace(/(.)@.*/, '$1')

    const matched = installedPlugins.some(({ npmName }) => {
      return npmName === testName
    })
    if (matched === true) {
      alreadyInstalled.push(testName)
    }
    else {
      toInstall.push(testPackage)
    }
  }

  let msg = ''
  if (toInstall.length > 0) {
    const registryData = 
      await determineRegistryData({ cache, registries : app.ext.serverSettings.registries, reporter })
    console.log('registryData (installPlugins):', registryData) // DEBUG
    const pluginSeries = selectMatchingSeries({ hostVersion, registryData })
    console.log('pluginSeries:', pluginSeries) // DEBUG
    const installSeries = await determineInstallationOrder({ installedPlugins, pluginSeries, toInstall })

    await fs.mkdir(pluginPkgDir, { recursive : true })

    const allLocalPackages = []
    const allProductionPackages = []
    for (const series of installSeries) {
      const { localPackages, productionPackages } =
        await install({ devPaths : app.ext.devPaths, packages : series, projectPath : pluginPkgDir })

      allLocalPackages.push(...localPackages)
      allProductionPackages.push(...productionPackages)

      if (reloadFunc !== undefined) {
        const reload = reloadFunc({ app })
        if (reload.then) {
          await reload
        }
      }
    }

    if (allLocalPackages.length > 0) {
      msg += '<em>Installed<rst> <code>' + allLocalPackages.join('<rst>, <code>') + '<rst> local packages\n'
    }
    if (allProductionPackages.length > 0) {
      msg += '<em>Installed<rst> <code>' + allProductionPackages.join('<rst>, <code>') + '<rst> production packages\n'
    }
    if (alreadyInstalled.length > 0) {
      msg += '<code>' + alreadyInstalled.join('<rst>, <code>') + '<rst> <em>already installed<rst>.'
    }

    return msg
  }
  else {
    if (alreadyInstalled.length > 0) {
      msg += '<code>' + alreadyInstalled.join('<rst>, <code>') + '<rst> <em>already installed<rst>.'
    }
    else {
      msg = 'Nothing to install.'
    }

    return msg
  }
}

export { installPlugins }
