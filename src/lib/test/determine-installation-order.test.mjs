/* global describe expect tests */
import { determineInstallationOrder } from '../determine-installation-order'

const pluginSeries = {
  handlers: [
    { npmName: 'foo' },
    { npmName: 'bar' },
    { npmName: 'biz', dependencies: [ 'foo', 'bar' ]},
    { npmName: 'boo', dependencies: ['biz'] }
  ],
  integrations: [
    { npmName: 'baz', dependencies: ['foo'] }
  ]
}

describe('determineInstallationOrder', () => {
  test('resolves trivial installation with no dependencies', () => {
    const installSeries = determineInstallationOrder({ installedPlugins: [], pluginSeries, toInstall: ['foo', 'bar'] })
    expect(installSeries).toHaveLength(1)
    const series = installSeries[0]
    expect(series).toHaveLength(2)
    expect(series.includes('foo')).toBe(true)
    expect(series.includes('bar')).toBe(true)
  })

  test('resolves single dependency', () => {
    const installSeries = determineInstallationOrder({ installedPlugins: [], pluginSeries, toInstall: ['baz'] })
    expect(installSeries).toHaveLength(2)
    const seriesA = installSeries[0]
    expect(seriesA).toEqual(['foo'])
    const seriesB = installSeries[1]
    expect(seriesB).toEqual(['baz'])
  })

  test('resolves single-depth, multiple dependencies', () => {
    const installSeries = determineInstallationOrder({ installedPlugins: [], pluginSeries, toInstall: ['biz'] })
    expect(installSeries).toHaveLength(2)
    const seriesA = installSeries[0]
    expect(seriesA).toHaveLength(2)
    expect(seriesA.includes('foo')).toBe(true)
    expect(seriesA.includes('bar')).toBe(true)
    const seriesB = installSeries[1]
    expect(seriesB).toEqual(['biz'])
  })

  test('resolves double depth dependencies', () => {
    const installSeries = determineInstallationOrder({ installedPlugins: ['foo'], pluginSeries, toInstall: ['boo'] })
    expect(installSeries).toHaveLength(3)
    const seriesA = installSeries[0]
    expect(seriesA).toEqual(['bar'])
    const seriesB = installSeries[1]
    expect(seriesB).toEqual(['biz'])
    const seriesC = installSeries[2]
    expect(seriesC).toEqual(['boo'])
  })

  test('recognizes installed plugins are satisfied', () => {
    const installSeries = determineInstallationOrder({ 
      installedPlugins: ['foo', 'bar'], 
      pluginSeries, 
      toInstall: ['biz'] 
    })
    expect(installSeries).toHaveLength(1)
    const series = installSeries[0]
    expect(series).toEqual(['biz'])
  })
})