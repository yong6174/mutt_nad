interface MuttNode {
  tokenId: number;
  parentA: number;  // 0 = Genesis
  parentB: number;
  avgRating: number;
  totalReviews: number;
}

export interface PurebloodRoute {
  path: number[];          // [child, parent, grandparent]
  avgRating: number;
  totalReviews: number;
  qualified: boolean;
}

const PUREBLOOD_MIN_RATING = 4.7;
const PUREBLOOD_MIN_REVIEWS = 10;

export function checkPureblood(
  child: MuttNode,
  getMutt: (id: number) => MuttNode | null
): { isPureblood: boolean; route: PurebloodRoute | null } {
  const routeA = buildRoute(child, 'A', getMutt);
  const routeB = buildRoute(child, 'B', getMutt);

  const qualifiedRoutes = [routeA, routeB].filter(r => r.qualified);

  if (qualifiedRoutes.length === 0) return { isPureblood: false, route: null };
  if (qualifiedRoutes.length === 1) return { isPureblood: true, route: qualifiedRoutes[0] };

  // Both qualified — pick higher rating
  const winner = qualifiedRoutes.sort((a, b) => b.avgRating - a.avgRating)[0];
  return { isPureblood: true, route: winner };
}

function buildRoute(
  child: MuttNode,
  side: 'A' | 'B',
  getMutt: (id: number) => MuttNode | null
): PurebloodRoute {
  const path: MuttNode[] = [child];

  const parentId = side === 'A' ? child.parentA : child.parentB;
  if (parentId > 0) {
    const parent = getMutt(parentId);
    if (parent) {
      path.push(parent);
      if (parent.parentA > 0) {
        const grandparent = getMutt(parent.parentA);
        if (grandparent) path.push(grandparent);
      }
    }
  }

  const totalReviews = path.reduce((sum, m) => sum + m.totalReviews, 0);
  const avgRating = path.reduce((sum, m) => sum + m.avgRating, 0) / path.length;

  return {
    path: path.map(m => m.tokenId),
    avgRating,
    totalReviews,
    qualified: avgRating >= PUREBLOOD_MIN_RATING && totalReviews >= PUREBLOOD_MIN_REVIEWS,
  };
}
