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
  const parentId = side === 'A' ? child.parentA : child.parentB;
  if (parentId <= 0) {
    return makeRoute([child]);
  }

  const parent = getMutt(parentId);
  if (!parent) {
    return makeRoute([child]);
  }

  // Try both grandparent sides — pick the better route
  const candidates: PurebloodRoute[] = [];

  for (const gpId of [parent.parentA, parent.parentB]) {
    if (gpId > 0) {
      const gp = getMutt(gpId);
      if (gp) {
        candidates.push(makeRoute([child, parent, gp]));
        continue;
      }
    }
    // No grandparent on this side — 2-node route
    if (candidates.length === 0) {
      candidates.push(makeRoute([child, parent]));
    }
  }

  // If no grandparents at all
  if (candidates.length === 0) {
    return makeRoute([child, parent]);
  }

  // Return the best (qualified first, then highest rating)
  candidates.sort((a, b) => {
    if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
    return b.avgRating - a.avgRating;
  });
  return candidates[0];
}

function makeRoute(nodes: MuttNode[]): PurebloodRoute {
  const totalReviews = nodes.reduce((sum, m) => sum + m.totalReviews, 0);
  const avgRating = nodes.reduce((sum, m) => sum + m.avgRating, 0) / nodes.length;
  return {
    path: nodes.map(m => m.tokenId),
    avgRating,
    totalReviews,
    qualified: avgRating >= PUREBLOOD_MIN_RATING && totalReviews >= PUREBLOOD_MIN_REVIEWS,
  };
}
