import * as fs from 'node:fs/promises'

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
    await fs.mkdir(pluginPkgDir, { recursive : true })

    const { localPackages, productionPackages } =
      await install({ devPaths : app.ext.devPaths, packages : toInstall, projectPath : pluginPkgDir })

    if (localPackages.length > 0) {
      msg += '<em>Installed<rst> <code>' + localPackages.join('<rst>, <code>') + '<rst> local packages\n'
    }
    if (productionPackages.length > 0) {
      msg += '<em>Installed<rst> <code>' + productionPackages.join('<rst>, <code>') + '<rst> production packages\n'
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
