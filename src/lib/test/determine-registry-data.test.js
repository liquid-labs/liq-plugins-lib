/* global afterAll afterEach beforeAll beforeEach describe expect jest test */
import { WeakCache } from '@liquid-labs/weak-cache'

import { determineRegistryData } from '../determine-registry-data'

const mockFetch = (results) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text : () => results
    })
  )
}

describe('determineRegistryData', () => {
  let cache, origFetch
  const jsonRegistries = ['https://foo.com/registry.json']
  const yamlRegistries = ['https://foo.com/registry.yaml']
  const registryJSON = { meta : { id : 'abc' } }
  const results = {
    abc : registryJSON
  }

  beforeAll(() => { origFetch = global.fetch })
  afterAll(() => { global.fetch = origFetch })

  beforeEach(() => {
    cache = new WeakCache()
  })
  afterEach(() => { cache?.release() })

  test('will retrieve JSON data', async() => {
    mockFetch(JSON.stringify(registryJSON))

    const data = await determineRegistryData({ cache, registries : jsonRegistries })

    expect(data).toEqual(results)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('will retrieve YAML data', async() => {
    mockFetch('meta:\n  id: abc')

    const data = await determineRegistryData({ cache, registries : yamlRegistries })

    expect(data).toEqual(results)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('will use the cache on subsequent retrievals', async() => {
    mockFetch(JSON.stringify(registryJSON))

    let data = await determineRegistryData({ cache, registries : jsonRegistries })
    expect(data).toEqual(results)
    expect(fetch).toHaveBeenCalledTimes(1)

    data = await determineRegistryData({ cache, registries : jsonRegistries })
    expect(data).toEqual(results)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
