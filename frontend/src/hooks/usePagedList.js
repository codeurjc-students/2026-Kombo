import { useEffect, useState } from 'react';

// Loads the pages of a paginated REST API resource ({ content, page }).
// fetchPage(pageNumber) must be stable (useCallback): when it changes, the list starts again from page 0.
// loadMore() adds the next page to the items already loaded (the "Más resultados" button).
// State is only set when a request finishes, as the React hooks rules recommend.
export default function usePagedList(fetchPage) {
  const [request, setRequest] = useState({ fetchPage, page: 0, attempt: 0 });
  const [state, setState] = useState({ request: null, items: [], pageInfo: null, error: null });

  // Derived state: a new fetchPage (for example, another category) restarts the list
  if (request.fetchPage !== fetchPage) {
    setRequest({ fetchPage, page: 0, attempt: 0 });
  }

  useEffect(() => {
    let cancelled = false;
    request
      .fetchPage(request.page)
      .then((result) => {
        if (!cancelled) {
          setState((previous) => ({
            request,
            items: request.page > 0 ? [...previous.items, ...result.content] : result.content,
            pageInfo: result.page,
            error: null,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((previous) => ({ ...previous, request, error }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  const sameList = state.request?.fetchPage === fetchPage;
  const pageInfo = sameList ? state.pageInfo : null;

  return {
    items: sameList ? state.items : [],
    pageInfo,
    loading: state.request !== request,
    error: state.request === request ? state.error : null,
    hasMore: Boolean(pageInfo && pageInfo.number + 1 < pageInfo.totalPages),
    loadMore: () => setRequest((current) => ({ ...current, page: (pageInfo?.number ?? 0) + 1, attempt: 0 })),
    retry: () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 })),
  };
}
