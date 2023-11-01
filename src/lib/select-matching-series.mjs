import * as semver from 'semver'

const selectMatchingSeries = ({ hostVersion, registryData }) => {
  return Object.entries(registryData).reduce((acc, entry) => {
    const [source, rd] = entry
    const { series } = rd

    const matchingSeries = series.find(({ versions }) =>
      semver.satisfies(hostVersion, versions, { includePrerelease : true }))

    if (matchingSeries !== undefined) {
      matchingSeries.source = source

      acc.push(matchingSeries)
    }

    return acc
  }, [])
}

export { selectMatchingSeries }
