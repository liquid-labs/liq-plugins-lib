import * as semver from 'semver'

const selectMatchingPlugins = ({ hostVersion, installedPlugins, pluginType, registryData }) => {
  console.log('installedPlugins:', installedPlugins)

  return Object.entries(registryData).reduce((acc, entry) => {
    const [source, rd] = entry
    const { series } = rd
    // const matchingSeries = series.find(({ versions }) => semver.satisfies(hostVersion, versions))
    const matchingSeries = series.find(({ versions }) =>
      semver.satisfies(hostVersion, versions, { includePrerelease : true }))

    const plugins = matchingSeries.plugins[pluginType] || []

    for (const pluginData of plugins) {
      pluginData.installed = installedPlugins.some((p) => p.npmName === rd.npmName)
      pluginData.source = source
      acc.push(pluginData)
    }
    return acc
  }, [])
}

export { selectMatchingPlugins }
