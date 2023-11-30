import { DepGraph } from 'dependency-graph'

import { getPackageOrgBasenameAndVersion } from '@liquid-labs/npm-toolkit'

const determineInstallationOrder = async({ installedPlugins, pluginSeries, toInstall }) => {
  // console.error('pluginSeries (determineInstallationOrder):', pluginSeries) // DEBUG

  const pluginEntries = pluginSeries.reduce((acc, series) => {
    // console.log('series (determineInstallationOrder):', series) // DEBUG
    const { plugins } = series
    // console.log('plugins:', plugins) // DEBUG
    for (const pluginList of Object.values(plugins)) {
      // console.log('pluginList:', pluginList) // DEBUG
      acc.push(...pluginList)
    }
    return acc
  }, [])

  // console.log('pluginEntries:', pluginEntries) // DEBUG

  const graph = new DepGraph()
  const toInstallClone = structuredClone(toInstall)

  for (const packageToInstall of toInstallClone) {
    // console.log('packageToInstall:', packageToInstall) // DEBUG
    if (!graph.hasNode(packageToInstall)) {
      graph.addNode(packageToInstall)
    }

    const { name } = await getPackageOrgBasenameAndVersion(packageToInstall)
    // console.log('name:', name) // DEBUG

    const { dependencies = [] } = pluginEntries.find((e) => e.npmName === name) || {}
    for (const dependency of dependencies) {
      if (installedPlugins.includes(dependency)) {
        continue
      }

      if (!graph.hasNode(dependency)) {
        graph.addNode(dependency)
        toInstallClone.push(dependency)
      }

      graph.addDependency(packageToInstall, dependency)
    }
  }
  // the graph is built

  const installSeries = []
  while (graph.size() > 0) {
    const series = graph.overallOrder(true)
    installSeries.push(series)

    for (const pkg of series) {
      graph.removeNode(pkg)
    }
  }

  return installSeries
}

export { determineInstallationOrder }
