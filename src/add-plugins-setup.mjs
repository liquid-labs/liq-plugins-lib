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
        const registryData = await determineRegistryData({ cache, registries: app.liq.serverSettings.registries })
        return registryData.reduce((acc, { plugins }) => acc.push(plugins.map(({ npmName }) => npmName)))
      }
    }
  ]

  return { help, method, parameters }
}

export { addPluginsSetup }