import * as fs from 'node:fs/promises'

import createError from 'http-errors'
import yaml from 'js-yaml'

const REGISTRY_DATA_KEY = 'liquid-labs/liq-core:registry-data'

const determineRegistryData = async({ cache, registries = [], update }) => {
  const cachedData = cache.get(REGISTRY_DATA_KEY)

  if (cachedData === undefined || update === true) {
    const data = {}
    for (const { url: registryURL } of registries) {
      let text
      if (registryURL.startsWith('file:')) {
        text = await fs.readFile(registryURL.slice(5))
      }
      else {
        try {
          const response = await fetch(registryURL)
          text = await response.text()
        }
        catch (e) {
          throw createError.InternalServerError(`Could not load registry data from ${registryURL}: ${e.message}`, { cause : e })
        }
      }
      let json
      try {
        json = registryURL.endsWith('.yaml') ? yaml.load(text) : JSON.parse(text)
      }
      catch (e) {
        throw createError.BadRequest(`Registry ${registryURL} does not parse as ${registryURL.endsWith('.yaml') ? 'YAML' : 'JSON'}.`, { cause : e })
      }
      const id = json?.meta?.id // TODO: verify using ajv
      if (id === undefined) {
        throw createError.BadRequest(`Registry ${registryURL} does not define 'meta.id'.`)
      }
      data[json.meta.id] = json
    }

    cache.put(REGISTRY_DATA_KEY, data)

    return data
  }
  else {
    return cachedData
  }
}

export { determineRegistryData, REGISTRY_DATA_KEY }
