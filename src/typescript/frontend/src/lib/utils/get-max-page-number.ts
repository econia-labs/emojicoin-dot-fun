export default function getMaxPageNumber(totalNumberOfMarkets: number, entriesPerPage: number) {
  if (entriesPerPage === 0) {
    console.warn("Attempt to divide by 0 entries per page in `getMaxPageNumber`");
    return 1;
  }
  const numPages = Math.ceil(totalNumberOfMarkets / entriesPerPage);
  // There's always at least one page.
  return Math.max(1, numPages);
}
