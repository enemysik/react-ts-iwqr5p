const size = 10;
const offset = 10;

export type Point = { x: number; y: number; cluster?: number };

export type Result = {
  points: Point[];
  centroid: Point;
  sum?: number;
  sum2?: number;
}[];

export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function drawPoint(ctx, x, y, color = 'Black') {
  ctx.fillStyle = color;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

export function drawPoints(ctx, points) {
  for (const point of points) {
    drawPoint(ctx, point.x, point.y);
  }
}

export function drawCircl(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, size);
  ctx.fill();
}

export function drawBorder(ctx, points, color) {
  const x = Math.min(...points.map((p) => p.x));
  const y = Math.min(...points.map((p) => p.y));
  const w = Math.max(...points.map((p) => p.x)) - x;
  const h = Math.max(...points.map((p) => p.y)) - y;

  ctx.strokeStyle = color;
  ctx.strokeRect(x - offset, y - offset, w + offset * 2, h + offset * 2);
}

export function calcSums(result: Result) {
  for (const group of result) {
    group.sum = group.points.reduce(
      (p, v) => p + distance(group.centroid, v),
      0
    );
  }
}

export function randomPoint(heitgh = 500, width = 300) {
  const x = Math.ceil(Math.random() * heitgh);
  const y = Math.ceil(Math.random() * width);
  return { x, y };
}

export const combine = (arr, k, withRepetition = false) => {
  const combinations = [];
  const combination = Array(k);
  // TS: const internalCombine = (start: number, depth: number): void => {
  const internalCombine = (start, depth) => {
    if (depth === k) {
      combinations.push([...combination]);
      return;
    }
    for (let index = start; index < arr.length; index++) {
      combination[depth] = arr[index];
      internalCombine(index + (withRepetition ? 0 : 1), depth + 1);
    }
  };
  internalCombine(0, 0);
  return combinations;
};
