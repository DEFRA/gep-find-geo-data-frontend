import { formatResolution } from './format-resolution.js'

describe('#formatResolution', () => {
  test.each([
    ['1:250,000', { scaleDenominators: [250000], distances: [] }],
    ['1:10,000', { scaleDenominators: [10000], distances: [] }],
    ['2m', { scaleDenominators: [], distances: ['2 urn:ogc:def:uom:EPSG::9001'] }],
    ['2m', { scaleDenominators: [], distances: ['  2 urn:ogc:def:uom:EPSG::9001  '] }],
    ['0.5m', { scaleDenominators: [], distances: ['0.5 urn:ogc:def:uom:EPSG::9001'] }],
    ['1:250,000, 2m', { scaleDenominators: [250000], distances: ['2 urn:ogc:def:uom:EPSG::9001'] }],
    ['', null]
  ])('formats resolution as "%s"', (expected, resolution) => {
    expect(formatResolution(resolution)).toBe(expected)
  })
})
