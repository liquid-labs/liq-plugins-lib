import createError from 'http-errors'

import { commonOutputParams, formatOutput } from '@liquid-labs/liq-handlers-lib'

import { determineRegistryData } from './lib/determine-registry-data'
import { selectMatchingPlugins } from './lib/select-matching-plugins'

const allFields = ['name', 'npmName', 'installed', 'summary', 'handlerCount', 'provider', 'homepage']

const listPluginsSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `${pluginsDesc} plugins list`,
    summary     : `Lists the installed ${pluginsDesc} plugins.`,
    description : `Lists the installed ${pluginsDesc} plugins.`
  }
  const method = 'get'

  const parameters = [
    // TODO: 'available' doesn't make sense if server is instantiated with 'noRegistries', but parameters are currently
    // statically loaded without visibility into the app configurations so we have no way of dynamically configuring
    // parameters. It makes sense to add a 'setupHandler' which is exported, and then that returns the handler func,
    // parameters, etc. It's a breaking change, but probably one that should happen.
    {
      name        : 'available',
      isBoolean   : true,
      description : 'Lists available plugins from registries rather than installed plugins.'
    },
    {
      name        : 'update',
      isBoolean   : true,
      description : 'Forces an update even if registry data is already cached.'
    },
    ...commonOutputParams() // option func setup on 'fields' below
  ]
  parameters.find((o) => o.name === 'fields').optionsFetcher = () => allFields

  return { help, method, parameters }
}

const generateRowText = ({
  codeClose,
  codeOpen,
  homepageClose = '',
  homepageOpen = '',
  installedClose = '',
  installedOpen = '',
  nameClose = '',
  nameOpen = '',
  p,
  providerClose = '',
  providerOpen = ''
}) => {
  let row = `- ${nameOpen}${p.name}${nameClose}`
  if (p.provider !== undefined) {
    row += ` from ${providerOpen}${p.provider}${providerClose}`
  }
  if (p.installed !== undefined || p.handlerCount !== undefined) {
    row += ` (${p.installed !== undefined ? `${installedOpen}installed${installedClose}` + (p.handlerCount !== undefined ? '; ' : '') : ''}${p.handlerCount !== undefined ? `${p.handlerCount} handlers` : ''})`
  }
  if (p.summary) {
    row += ': '
    row += p.summary !== undefined ? p.summary : ''
  }
  if (p.npmName !== undefined || p.homepage !== undefined) {
    row += '\n  '
    row += p.npmName !== undefined
      ? `NPM: ${codeOpen}${p.npmName}${codeClose}`
      + (p.homepage !== undefined ? ' ' : '')
      : ''
    row += p.homepage !== undefined ? `homepage: ${homepageOpen}${p.homepage}${homepageClose}` : ''
  }

  return row
}

const mdFormatter = ({ data = [], title }) => `# ${title}\n\n`
  + data.map((p) => generateRowText({
    codeClose      : '`',
    codeOpen       : '`',
    homepageClose  : '_',
    homepageOpen   : '_',
    installedClose : '__',
    installedOpen  : '__',
    nameClose      : '___',
    nameOpen       : '___',
    p,
    providerClose  : '__',
    providerOpen   : '__'
  })).join('\n')
  // `- **${p.name}** (${ p.installed !== undefined ? 'installed' + (p.handlerCount !== undefined ? '; ' : '') : ''} ${p.handlerCount} handlers): ${p.summary}`).join('\n') + '\n'

const terminalFormatter = ({ data = [] }) => {
  return data.map((p) => generateRowText({
    codeClose      : '<rst>',
    codeOpen       : '<code>',
    homepageClose  : '<rst>',
    homepageOpen   : '<code>',
    installedClose : '<rst>',
    installedOpen  : '<em>',
    nameClose      : '<rst>',
    nameOpen       : '<h2>',
    p,
    providerClose  : '<rst>',
    providerOpen   : '<bold>'
  })).join('\n')
}
// `- <em>${p.name}<rst> (${p.handlerCount} handlers): ${p.summary}`).join('\n') + '\n'

const textFormatter = ({ data = [] }) =>
  data.map((p) => generateRowText({ p })).join('\n')
// `- ${p.name} (${p.handlerCount} handlers): ${p.summary}`).join('\n') + '\n'

const listPluginsHandler = ({ hostVersionRetriever, installedPluginsRetriever, pluginType }) =>
  ({ app, cache, model, reporter }) => async(req, res) => {
    const hostVersion = hostVersionRetriever({ app, model })
    const installedPlugins = installedPluginsRetriever({ app, model, req }) || []

    const { available, update } = req.vars

    const defaultFields = available === true
      ? ['name', 'summary', 'provider', 'homepage']
      : ['name', 'handlerCount', 'installed', 'summary', 'provider', 'homepage']
    const data = available === true
      ? (app.ext.noRegistries === true
        ? throw createError.BadRequest("This server does not use registries; the 'available' parameter cannot be used.")
        : await getAvailablePlugins({ app, cache, hostVersion, installedPlugins, pluginType, update }))
      : installedPlugins
        .map((p) => ({ ...p, installed : true }))
        .sort((a, b) =>
          a.name.localeCompare(b.name)) // 1 and -1 are true-ish, only zero then fallsback to the secondary sort
    formatOutput({
      basicTitle : 'Plugins Report',
      data,
      allFields,
      defaultFields,
      mdFormatter,
      terminalFormatter,
      textFormatter,
      reporter,
      req,
      res,
      ...req.vars
    })
  }

const getAvailablePlugins = async({ app, cache, hostVersion, installedPlugins, pluginType, update }) => {
  const registryData = await determineRegistryData({ cache, registries : app.ext.serverSettings.registries, update })

  return selectMatchingPlugins({ hostVersion, installedPlugins, pluginType, registryData })
}

export { listPluginsHandler, listPluginsSetup }
