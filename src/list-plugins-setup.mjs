const listPluginsSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `${pluginsDesc} lugins list`,
    summary     : `Lists the installed ${pluginsDesc} plugins.`,
    description : `Lists the installed ${pluginsDesc} plugins.`
  }
  const method = 'get'

  const parameters = [
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

  return { help, method, parameters }
}

export { listPluginsSetup }
