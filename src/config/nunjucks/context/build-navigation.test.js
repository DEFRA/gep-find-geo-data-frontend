import { buildNavigation } from './build-navigation.js'

function currentItems (path) {
  return buildNavigation({ path })
    .filter((item) => item.current)
    .map((item) => item.text)
}

describe('#buildNavigation', () => {
  test.each([
    ['/', ['Home']],
    ['/search', ['ATLAS Search']],
    ['/dataset/abc-123', ['ATLAS Search']],
    ['/privacy', []],
    [undefined, []]
  ])('marks current items for %s', (path, expected) => {
    expect(currentItems(path)).toEqual(expected)
  })
})
