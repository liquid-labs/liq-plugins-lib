import { selectMatchingSeries } from './select-matching-series'

const selectMatchingPlugins = ({ hostVersion, installedPlugins, pluginType, registryData }) => {
  const series = selectMatchingSeries({ hostVersion, registryData })

  return series.reduce((acc, seriesData) => {
    const { source } = seriesData
    const plugins = seriesData.plugins?.[pluginType] || []

    for (const pluginData of plugins) {
      if (installedPlugins !== undefined) {
        pluginData.installed = installedPlugins.some((p) => p.npmName === pluginData.npmName)
      }
      pluginData.source = source
      acc.push(pluginData)
    }
    return acc
  }, [])
}

export { selectMatchingPlugins }
