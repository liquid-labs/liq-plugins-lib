const detailsPluginSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `${pluginsDesc} plugins details`,
    summary     : 'Provides details on the named plugin.',
    description : 'Provides details on the named plugin.'
  }
  const method = 'get'

  const parameters = []

  return { help, method, parameters }
}

export { detailsPluginSetup }
