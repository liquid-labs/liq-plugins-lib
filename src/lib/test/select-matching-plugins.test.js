/* global describe expect test */
import yaml from 'js-yaml'

import { selectMatchingPlugins } from '../select-matching-plugins'

const registryYaml =
`registry.liquid-labs.com:
  meta:
    id: registry.liquid-labs.com
    summary: The standard liq registry maintained by Liquid Labs.
    lastUpdated: 2023-05-25T1525Z
  series:
  - versions: '^1'
    plugins:
      handlers:
      - name: projects
        npmName: '@liquid-labs/liq-projects'
        summary: Manages liq enabled projects (NPM packages).
        provider: liquid-labs.com
        homepage: https://github.com/liquid-labs/liq-projects
  - versions: '^2'
    plugins:
      handlers:
      - name: projects
        npmName: '@liquid-labs/liq-projects2'
        summary: Manages liq enabled projects (NPM packages).
        provider: liquid-labs.com
        homepage: https://github.com/liquid-labs/liq-projects2
registry.foo.com:
  meta:
    id: registry.foo.com
    summary: The standard foo registry maintained by Liquid Labs.
    lastUpdated: 2023-05-25T1525Z
  series:
  - versions: '^1'
    plugins:
      handlers:
      - name: audits
        npmName: '@foo/liq-audits'
        summary: Manages liq audits.
        provider: foo.com
        homepage: https://github.com/foo/liq-audits
`

describe('selectMatchingPlugins', () => {
  const registryData = yaml.load(registryYaml)

  test('selects first matching series', () => {
    const plugins = selectMatchingPlugins({ hostVersion : '2.3.0', pluginType : 'handlers', registryData })
    expect(plugins).toHaveLength(1)
    expect(plugins[0].npmName).toBe('@liquid-labs/liq-projects2')
  })

  test('combines mulitple sources', () => {
    const plugins = selectMatchingPlugins({ hostVersion : '1.3.0', pluginType : 'handlers', registryData })
    expect(plugins).toHaveLength(2)
    expect(plugins[0].npmName).toBe('@liquid-labs/liq-projects')
    expect(plugins[1].npmName).toBe('@foo/liq-audits')
  })
})
