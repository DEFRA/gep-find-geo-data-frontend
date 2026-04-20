/**
 * @typedef PaginationItem
 * @property {number} [number]
 * @property {string} [href]
 * @property {boolean} [current]
 * @property {boolean} [ellipsis]
 *
 * @typedef Pagination
 * @property {PaginationItem[]} items
 * @property {{ href: string }} [previous]
 * @property {{ href: string }} [next]
 */

/**
 * Builds the input for the `govukPagination` Nunjucks macro.
 *
 * Follows the GOV.UK Design System rule: always show the first, last, current
 * and adjacent pages, with an ellipsis filling any gap. `previous` is omitted
 * on the first page and `next` is omitted on the last.
 *
 * @see https://design-system.service.gov.uk/components/pagination/
 *
 * @param {object} options
 * @param {number} options.page - the page the user is on (1-based)
 * @param {number} options.pageSize
 * @param {number} options.total - total result count
 * @param {(page: number) => string} options.hrefFor
 * @returns {Pagination | null}
 */
export function buildPagination ({ page, pageSize, total, hrefFor }) {
  if (total <= 0 || pageSize <= 0) {
    return null
  }
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) {
    return null
  }

  const current = Math.min(Math.max(page, 1), totalPages)

  const pageNumbers = [...new Set([1, current - 1, current, current + 1, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)

  const items = []
  let prev = 0
  for (const n of pageNumbers) {
    if (n - prev > 1) {
      items.push({ ellipsis: true })
    }
    items.push({ number: n, href: hrefFor(n), current: n === current })
    prev = n
  }

  return {
    items,
    ...(current > 1 && { previous: { href: hrefFor(current - 1) } }),
    ...(current < totalPages && { next: { href: hrefFor(current + 1) } })
  }
}
