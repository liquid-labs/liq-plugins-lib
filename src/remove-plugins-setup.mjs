const removePluginsSetup = ({ pluginsDesc }) => {
  const help = {
    name        : `remove ${pluginsDesc} plugins`,
    summary     : 'Removes the named plugin.',
    description : 'Removes the named plugin.'
  }
  
  const method = 'delete'

  const parameters = []

  return { help, method, parameters }
}

export { removePluginsSetup }

