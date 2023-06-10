import { distance, Point, Result } from './utils';
import { lap } from 'linear-assignment-js/dist/lap-jv/lap';

const epsilon = 0.0000001;

export function alpha3(
  points: Point[],
  clusters: number,
  startPoints?: Point[]
) {
  let input1: Result;

  if (startPoints == null) {
    input1 = startDray(points, clusters);
  } else {
    input1 = startPoints.map((p) => ({
      centroid: p,
      points: [],
    }));
  }

  return retryUntil(input1, (centers) => {
    const matrix = calculateMatrixCentoid(points, centers);
    centers.matrix = structuredClone(matrix);
    // console.log(matrix);

    // const count = points.length - clusters;
    // const oneCount = Math.ceil(count / clusters);

    // for (let k = 0; k < clusters; k++)
    //   for (let i = 0; i < oneCount; i++) {
    //     matrix.push(matrix[k].slice());
    //   }

    // console.log(matrix);

    for (let i = 0; i < points.length - clusters; i++) {
      matrix.push(matrix[i % clusters].slice());
    }

    const lapResult = lap(matrix.length, matrix);

    for (let i = 0; i < matrix.length; i++) {
      const clusterIndex = lapResult.col[i] % clusters;

      for (let k = 0; k < clusters; k++) {
        if (k === clusterIndex) {
          continue;
        }
        centers.matrix[k][i] = null;
      }

      if (clusterIndex === -1) {
        console.log('skipped');
        continue;
      }
      centers[clusterIndex].points.push(points[i]);
    }
  });
}

function startDray(points: Point[], clusters: number) {
  let count = Math.ceil(points.length / clusters) - 1;

  let workPoints = points.slice();
  const results = [];

  for (let j = 0; j < clusters; j++) {
    const matrix = calculateMatrix(workPoints);

    const tmp = matrix.map((l) => Math.max(...l));
    const mostDistantPointIndex = tmp.indexOf(Math.max(...tmp));

    const line = matrix[mostDistantPointIndex];

    let tmp2 = line.filter((d) => d !== 0);

    const nearestPointsIndexes = [mostDistantPointIndex];

    for (let i = 0; i < count; i++) {
      const index = line.indexOf(Math.min(...tmp2));
      nearestPointsIndexes.push(index);

      const tIndex = tmp2.indexOf(Math.min(...tmp2));
      tmp2[tIndex] = 0;
      tmp2 = tmp2.filter((d) => d !== 0);
    }

    results.push({
      points: workPoints.filter(
        (_, i) => j + 1 === clusters || nearestPointsIndexes.indexOf(i) !== -1
      ),
    });

    workPoints = workPoints.filter(
      (_, i) => nearestPointsIndexes.indexOf(i) === -1
    );
  }

  count = Math.ceil(points.length / clusters);

  return recalculateCetroids(results);
}

export function kmeansF(points: Point[], clusters: number) {
  // const xSomet = points.reduce((p, v) => p + v.x, 0) / points.length;
  // const ySomet = points.reduce((p, v) => p + v.y, 0) / points.length;

  // function calcWeight(point) {
  //   return (
  //     (Math.abs(point.x - xSomet) + Math.abs(point.y - ySomet)) /
  //     ((xSomet + ySomet) / 2)
  //   );
  // }

  points = points.slice().sort((a, b) => {
    // return calcWeight(a) - calcWeight(b);

    const xDiff = a.x - b.x;
    const yDiff = a.y - b.y;
    if (yDiff !== 0) {
      return yDiff;
    }
    return xDiff;
  });
  const partial = startDray(points, clusters);
  const maxPointsPerCluster = Math.ceil(points.length / clusters);

  return retryUntil(partial, (centers) => {
    const clusterPointsCount = new Array(clusters).fill(0);

    for (const p of points) {
      const distances = [];
      for (const group of centers) {
        const dist = distance(p, group.centroid);
        distances.push(dist);
      }

      let minCentroid: number;

      while (true) {
        minCentroid = distances.indexOf(Math.min(...distances));

        if (clusterPointsCount[minCentroid] >= maxPointsPerCluster) {
          distances[minCentroid] = Number.MAX_SAFE_INTEGER;
          continue;
        }

        break;
      }

      centers[minCentroid].points.push(p);
      clusterPointsCount[minCentroid]++;
    }
  });
}

// function Assign(result: Result) {}

function calculateMatrix(points: Point[]) {
  const matrix: number[][] = []; // 5x5
  for (const p1 of points) {
    const line = [];
    matrix.push(line);
    for (const p2 of points) {
      line.push(distance(p1, p2));
    }
  }

  return matrix;
}

function checkEqual(r1: Result, r2: Result) {
  for (let i = 0; i < r1.length; i++) {
    if (!checkPointEqual(r1[i].centroid, r2[i].centroid)) {
      return false;
    }
  }

  return true;
}

function checkPointEqual(p1: Point, p2: Point) {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}

function calculateMatrixCentoid(points: Point[], centers: Result) {
  const m1 = []; //matrix

  for (const group of centers) {
    const distances = []; // line
    for (const point of points) {
      const dist = distance(point, group.centroid);
      distances.push(dist);
    }

    m1.push(distances);
  }

  return m1;
}

function retryUntil(begin: Result, action: Function) {
  const iterations: Result[] = [];
  // begin = recalculateCetroids(begin);
  iterations.push(begin);
  let index = 0;

  let iteration = structuredClone(iterations[index]);

  action(iteration);
  iterations.push(iteration);
  index++;

  do {
    const iteration = recalculateCetroids(iterations[index]);

    action(iteration);

    iterations.push(iteration);
    index++;
  } while (
    index < 100 &&
    !checkEqual(iterations[index], iterations[index - 1])
  );

  return iterations;
}

function recalculateCetroids(input: Result, savePoints = false): Result {
  return input.map((group) => {
    const xCenter =
      group.points.reduce((p, v) => p + v.x, 0) / group.points.length;
    const yCenter =
      group.points.reduce((p, v) => p + v.y, 0) / group.points.length;

    const result = {
      centroid: { x: xCenter, y: yCenter },
      points: [],
    };

    if (savePoints) {
      result.points = group.points.slice();
    }

    return result;
  });
}
