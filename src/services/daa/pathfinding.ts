// DAA Pathfinding Implementation: A* Search and Dijkstra's Algorithm
// Includes Priority Queue Min-Heap, Geographic Grid Projection, and Node Metrics.

import type { Coordinates } from '../../types';

export interface GridPoint {
  x: number; // Column index (0 .. cols-1)
  y: number; // Row index (0 .. rows-1)
}

export type HeuristicType = 'manhattan' | 'euclidean' | 'octile' | 'dijkstra_zero';

export interface PathfindingResult {
  algorithm: 'A*' | 'Dijkstra';
  found: boolean;
  path: GridPoint[];
  pathCoordinates?: Coordinates[];
  cost: number;
  expandedNodes: number;
  visitedOrder: GridPoint[];
  executionTimeMs: number;
  heuristicUsed: HeuristicType;
  unreachableReason?: string;
}

export interface HazardObstacle {
  id: string;
  name: string;
  type: 'FLOOD_ZONE' | 'CONVECTIVE_STORM' | 'NO_FLY_ZONE' | 'RADIO_BLACKOUT';
  center: Coordinates;
  radiusKm: number;
  severity: 'HIGH' | 'EXTREME';
}

// Default North Bihar Disaster Hazard Obstacles (Floods / Storms)
export const DEFAULT_HAZARD_OBSTACLES: HazardObstacle[] = [
  {
    id: 'HAZ-001',
    name: 'Bagmati River Severe Flash Flood Corridor',
    type: 'FLOOD_ZONE',
    center: { lat: 26.38, lng: 85.65 },
    radiusKm: 14,
    severity: 'EXTREME',
  },
  {
    id: 'HAZ-002',
    name: 'Madhubani Sector Convective Thunderstorm Cell',
    type: 'CONVECTIVE_STORM',
    center: { lat: 26.28, lng: 86.00 },
    radiusKm: 11,
    severity: 'HIGH',
  },
  {
    id: 'HAZ-003',
    name: 'Sitamarhi Southern Flood Breach Inundation',
    type: 'FLOOD_ZONE',
    center: { lat: 26.48, lng: 85.42 },
    radiusKm: 12,
    severity: 'HIGH',
  },
];

// Geographic bounding box for North Bihar Operations
export const BIHAR_BOUNDS = {
  minLat: 25.80,
  maxLat: 26.80,
  minLng: 85.10,
  maxLng: 86.30,
};

// Binary Min-Heap Priority Queue for optimal O(log V) operations
interface HeapNode {
  point: GridPoint;
  priority: number;
}

export class MinHeap {
  private heap: HeapNode[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(point: GridPoint, priority: number): void {
    this.heap.push({ point, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.heap[current].priority < this.heap[parent].priority) {
        const tmp = this.heap[current];
        this.heap[current] = this.heap[parent];
        this.heap[parent] = tmp;
        current = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    let current = index;
    const length = this.heap.length;
    while (true) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let smallest = current;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest !== current) {
        const tmp = this.heap[current];
        this.heap[current] = this.heap[smallest];
        this.heap[smallest] = tmp;
        current = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Heuristic calculations for A* search.
 * Admissible and monotonic (consistent) heuristics ensure optimal paths.
 */
export const calculateHeuristic = (
  a: GridPoint,
  b: GridPoint,
  type: HeuristicType = 'octile'
): number => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);

  switch (type) {
    case 'manhattan':
      // Appropriate for 4-connected grid
      return dx + dy;
    case 'euclidean':
      // Straight-line distance
      return Math.sqrt(dx * dx + dy * dy);
    case 'octile':
      // Optimal for 8-connected grid (diagonal movement allowed, cost sqrt(2) ≈ 1.414)
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    case 'dijkstra_zero':
      // Dijkstra is equivalent to A* with h(n) = 0
      return 0;
    default:
      return Math.sqrt(dx * dx + dy * dy);
  }
};

/**
 * Converts Geographic GPS Coordinates into a discrete Grid coordinate.
 */
export const latLngToGrid = (
  coord: Coordinates,
  rows: number = 25,
  cols: number = 25,
  bounds = BIHAR_BOUNDS
): GridPoint => {
  const clampedLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, coord.lat));
  const clampedLng = Math.max(bounds.minLng, Math.min(bounds.maxLng, coord.lng));

  // Latitude decreases downwards (row 0 = north / maxLat, row rows-1 = south / minLat)
  const normY = (bounds.maxLat - clampedLat) / (bounds.maxLat - bounds.minLat);
  const normX = (clampedLng - bounds.minLng) / (bounds.maxLng - bounds.minLng);

  const y = Math.min(rows - 1, Math.max(0, Math.floor(normY * rows)));
  const x = Math.min(cols - 1, Math.max(0, Math.floor(normX * cols)));

  return { x, y };
};

/**
 * Converts a discrete Grid coordinate back into Geographic GPS Coordinates.
 */
export const gridToLatLng = (
  point: GridPoint,
  rows: number = 25,
  cols: number = 25,
  bounds = BIHAR_BOUNDS
): Coordinates => {
  const cellWidthLng = (bounds.maxLng - bounds.minLng) / cols;
  const cellHeightLat = (bounds.maxLat - bounds.minLat) / rows;

  const lat = bounds.maxLat - (point.y + 0.5) * cellHeightLat;
  const lng = bounds.minLng + (point.x + 0.5) * cellWidthLng;

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
};

/**
 * Builds a 2D occupancy grid where 0 = clear, 1 = impassable obstacle.
 */
export const createGridMap = (
  rows: number = 25,
  cols: number = 25,
  hazards: HazardObstacle[] = DEFAULT_HAZARD_OBSTACLES,
  bounds = BIHAR_BOUNDS
): number[][] => {
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  hazards.forEach((haz) => {
    const centerPoint = latLngToGrid(haz.center, rows, cols, bounds);
    // Approximate radius in grid cells based on longitude span (~120 km across bounds)
    const spanKm = 120;
    const radiusCells = Math.max(1, Math.round((haz.radiusKm / spanKm) * cols));

    for (let dy = -radiusCells; dy <= radiusCells; dy++) {
      for (let dx = -radiusCells; dx <= radiusCells; dx++) {
        if (dx * dx + dy * dy <= radiusCells * radiusCells) {
          const cy = centerPoint.y + dy;
          const cx = centerPoint.x + dx;
          if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) {
            grid[cy][cx] = 1; // Blocked obstacle
          }
        }
      }
    }
  });

  return grid;
};

/**
 * Generic Pathfinding Engine supporting both A* Search and Dijkstra's Algorithm.
 * 8-directional movement with diagonal traversal cost sqrt(2).
 */
export const runPathfinding = (
  grid: number[][],
  start: GridPoint,
  goal: GridPoint,
  algorithm: 'A*' | 'Dijkstra' = 'A*',
  heuristicType: HeuristicType = 'octile',
  allowDiagonal: boolean = true
): PathfindingResult => {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Boundary & initial obstacle validation
  if (
    start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows ||
    goal.x < 0 || goal.x >= cols || goal.y < 0 || goal.y >= rows
  ) {
    return {
      algorithm,
      found: false,
      path: [],
      cost: 0,
      expandedNodes: 0,
      visitedOrder: [],
      executionTimeMs: 0,
      heuristicUsed: heuristicType,
      unreachableReason: 'Start or goal coordinate falls outside grid bounds.',
    };
  }

  if (grid[start.y][start.x] === 1) {
    return {
      algorithm,
      found: false,
      path: [],
      cost: 0,
      expandedNodes: 0,
      visitedOrder: [],
      executionTimeMs: 0,
      heuristicUsed: heuristicType,
      unreachableReason: 'Start location is inside an impassable hazard zone.',
    };
  }

  if (grid[goal.y][goal.x] === 1) {
    return {
      algorithm,
      found: false,
      path: [],
      cost: 0,
      expandedNodes: 0,
      visitedOrder: [],
      executionTimeMs: 0,
      heuristicUsed: heuristicType,
      unreachableReason: 'Target destination is completely enveloped by an active hazard zone.',
    };
  }

  // Cost array gScore[y][x]
  const gScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  // CameFrom parent pointer map (stored as flat key y * cols + x)
  const cameFrom: Map<number, GridPoint> = new Map();
  const closedSet: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const visitedOrder: GridPoint[] = [];

  const openHeap = new MinHeap();
  const key = (p: GridPoint) => p.y * cols + p.x;

  const effectiveHeuristic: HeuristicType = algorithm === 'Dijkstra' ? 'dijkstra_zero' : heuristicType;

  gScore[start.y][start.x] = 0;
  const initialH = calculateHeuristic(start, goal, effectiveHeuristic);
  openHeap.insert(start, initialH);

  let expandedNodes = 0;
  let targetReached = false;

  // 8-directional neighbor offsets
  const directions = allowDiagonal
    ? [
        { dx: 0, dy: -1, cost: 1.0 },     // North
        { dx: 1, dy: -1, cost: Math.SQRT2 }, // NE
        { dx: 1, dy: 0, cost: 1.0 },      // East
        { dx: 1, dy: 1, cost: Math.SQRT2 },  // SE
        { dx: 0, dy: 1, cost: 1.0 },      // South
        { dx: -1, dy: 1, cost: Math.SQRT2 }, // SW
        { dx: -1, dy: 0, cost: 1.0 },     // West
        { dx: -1, dy: -1, cost: Math.SQRT2 },// NW
      ]
    : [
        { dx: 0, dy: -1, cost: 1.0 },
        { dx: 1, dy: 0, cost: 1.0 },
        { dx: 0, dy: 1, cost: 1.0 },
        { dx: -1, dy: 0, cost: 1.0 },
      ];

  while (!openHeap.isEmpty()) {
    const currentEntry = openHeap.pop()!;
    const current = currentEntry.point;

    if (closedSet[current.y][current.x]) continue;

    closedSet[current.y][current.x] = true;
    expandedNodes++;
    visitedOrder.push(current);

    // Goal test
    if (current.x === goal.x && current.y === goal.y) {
      targetReached = true;
      break;
    }

    // Expand neighbors
    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (grid[ny][nx] === 1) continue; // Impassable obstacle
      if (closedSet[ny][nx]) continue;

      // Prevent corner cutting if moving diagonally through adjacent orthogonal walls
      if (dir.dx !== 0 && dir.dy !== 0) {
        if (grid[current.y][nx] === 1 && grid[ny][current.x] === 1) {
          continue; // Blocked diagonal squeeze
        }
      }

      const tentativeG = gScore[current.y][current.x] + dir.cost;

      if (tentativeG < gScore[ny][nx]) {
        gScore[ny][nx] = tentativeG;
        cameFrom.set(ny * cols + nx, current);
        const h = calculateHeuristic({ x: nx, y: ny }, goal, effectiveHeuristic);
        const fScore = tentativeG + h;
        openHeap.insert({ x: nx, y: ny }, fScore);
      }
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  if (!targetReached) {
    return {
      algorithm,
      found: false,
      path: [],
      cost: 0,
      expandedNodes,
      visitedOrder,
      executionTimeMs,
      heuristicUsed: effectiveHeuristic,
      unreachableReason: 'No continuous unblocked path exists between start and destination.',
    };
  }

  // Reconstruct path
  const path: GridPoint[] = [];
  let curr: GridPoint | undefined = goal;
  while (curr) {
    path.unshift(curr);
    if (curr.x === start.x && curr.y === start.y) break;
    curr = cameFrom.get(key(curr));
  }

  return {
    algorithm,
    found: true,
    path,
    cost: Number(gScore[goal.y][goal.x].toFixed(3)),
    expandedNodes,
    visitedOrder,
    executionTimeMs,
    heuristicUsed: effectiveHeuristic,
  };
};

/**
 * High-level pathfinder for drone sorties in North Bihar.
 * Converts lat/lng into grid points, executes A* around hazard zones, and converts
 * resulting path points back into smooth geographic flight waypoints.
 */
export const calculateAStarFlightRoute = (
  startCoords: Coordinates,
  targetCoords: Coordinates,
  hazards: HazardObstacle[] = DEFAULT_HAZARD_OBSTACLES,
  rows: number = 25,
  cols: number = 25
): {
  waypoints: Coordinates[];
  result: PathfindingResult;
  usedAStar: boolean;
} => {
  const grid = createGridMap(rows, cols, hazards);
  const startGrid = latLngToGrid(startCoords, rows, cols);
  const targetGrid = latLngToGrid(targetCoords, rows, cols);

  // If start or target is on an obstacle cell, clear that cell temporarily so sortie can depart/arrive
  if (grid[startGrid.y][startGrid.x] === 1) grid[startGrid.y][startGrid.x] = 0;
  if (grid[targetGrid.y][targetGrid.x] === 1) grid[targetGrid.y][targetGrid.x] = 0;

  const result = runPathfinding(grid, startGrid, targetGrid, 'A*', 'octile', true);

  if (result.found && result.path.length > 1) {
    const geoWaypoints = result.path.map((pt) => gridToLatLng(pt, rows, cols));
    // Ensure exact start and end coordinates are preserved
    geoWaypoints[0] = { ...startCoords };
    geoWaypoints[geoWaypoints.length - 1] = { ...targetCoords };

    return {
      waypoints: geoWaypoints,
      result: {
        ...result,
        pathCoordinates: geoWaypoints,
      },
      usedAStar: true,
    };
  }

  // Fallback to direct interpolated points if path blocked
  return {
    waypoints: [startCoords, targetCoords],
    result,
    usedAStar: false,
  };
};
