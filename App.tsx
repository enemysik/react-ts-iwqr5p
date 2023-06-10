import * as React from 'react';
import { useImmer } from 'use-immer';
import { kmeans } from 'ml-kmeans';

import {
  drawPoints,
  drawPoint,
  drawCircl,
  drawBorder,
  Point,
  Result,
  calcSums,
  combine,
} from './utils';
import './style.css';
import { colors } from './colors';
import { dray2, andre2 } from './andrey';
import Points from './Points';
import Groups from './Groups';

var time = 0;
var iter = 0;

// 4. add new algor...
type ClickEvent = React.SyntheticEvent<HTMLCanvasElement, MouseEvent>;

export default function App() {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [clusters, updateClusters] = React.useState(3);
  const [index, updateIndex] = React.useState(null);
  const [points, updatePoints] = useImmer<Point[]>([]);
  const [result, updateResult] = useImmer<Result>([]);
  const [iterations, updateIterations] = useImmer<Result[]>([]);
  const [selectdIteration, updateSelectdIteration] = useImmer<number>(null);

  function handleClustersChange(event) {
    updateClusters(+event.target.value || clusters);
  }

  function handleClick(event: ClickEvent) {
    const ctx = canvas.current.getContext('2d');
    const x = event.nativeEvent.clientX - canvas.current.offsetLeft;
    const y = event.nativeEvent.clientY - canvas.current.offsetTop;

    drawPoint(ctx, x, y);
    updatePoints([...points, { x, y }]);
  }

  function kMeans(): Result {
    const result = kmeans(
      points.map((p) => [p.x, p.y]),
      clusters,
      {
        initialization: 'mostDistant',
      }
    );
    iter = result.iterations;
    const r = result.centroids.reduce<Result>((p, c, i) => {
      p[i] = {
        centroid: { x: c[0], y: c[1] },
        points: [],
      };
      return p;
    }, []);

    result.clusters.forEach((c, i) => {
      r[c].points.push(points[i]);

      // TODO refactor
      updatePoints((draft) => {
        draft[i].cluster = c;
      });
    });
    calcSums(r);
    return r;
  }

  function handleProcessKmeans() {
    updateIndex(null);
    const start = performance.now();
    const result = kMeans();
    handleResult(result);
    const end = performance.now();
    time = Math.round((end - start) * 1000) / 1000;
  }

  function handleProcessDray2() {
    const start = performance.now();
    const iterations = dray2(points, clusters);
    updateIterations(iterations);
    // handleProcessAndreyCommon({ result, index });
    iter = iterations.length;
    const end = performance.now();
    time = Math.round((end - start) * 1000) / 1000;

    const index = iterations.length - 1;
    updateSelectdIteration(index);
    const result = iterations[index];
    handleProcessAndreyCommon({ result, index });
  }

  function handleProcessAndre2() {
    const start = performance.now();
    const iterations = andre2(points, clusters);
    updateIterations(iterations);
    // handleProcessAndreyCommon({ result, index });
    iter = iterations.length;
    const end = performance.now();
    time = Math.round((end - start) * 1000) / 1000;

    const index = iterations.length - 1;
    updateSelectdIteration(index);
    const result = iterations[index];
    handleProcessAndreyCommon({ result, index });
  }

  function handleProcessAndreyCommon({ result, index }) {
    updateIndex(index);

    console.log(result.matrix);

    result.forEach((g, i) => {
      g.points.forEach((p) => {
        updatePoints((draft) => {
          draft.find((p1) => p1.x === p.x && p1.y === p.y).cluster = i;
        });
      });
    });

    calcSums(result);
    handleResult(result);
  }

  function handleResult(result: Result) {
    const ctx = canvas.current.getContext('2d');
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

    updateResult(result);

    result.forEach((group, index) => {
      drawCircl(ctx, group.centroid.x, group.centroid.y, colors[index]);
      console.log(group, index, colors[index]);
      for (const point of group.points) {
        drawPoint(ctx, point.x, point.y, colors[index]);
      }
      drawBorder(ctx, group.points, colors[index]);
    });
  }

  function handleClearData() {
    const ctx = canvas.current.getContext('2d');
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
    updatePoints([]);
    updateIndex(null);
  }

  function handleClearResult() {
    const ctx = canvas.current.getContext('2d');
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
    updatePoints(points.map((p) => ({ x: p.x, y: p.y })));
    updateIndex(null);
    drawPoints(ctx, points);
  }

  function handlePointsChange(points: Point[]) {
    const ctx = canvas.current.getContext('2d');
    handleClearData();
    updatePoints(points);
    drawPoints(ctx, points);
  }

  function handleRemoveLastPoint() {
    const ctx = canvas.current.getContext('2d');
    handleClearData();
    updatePoints(points.slice(0, -1));
    drawPoints(ctx, points.slice(0, -1));
  }

  function handleProcessRandomDray2() {
    // const input = new Array(clusters).fill({ x: 0, y: 0 });
    // const randomPoints = [randomPoint(), randomPoint(), randomPoint()];
    const start = performance.now();
    const combinations = combine(points, clusters);
    console.log(combinations);

    const allIterations = [];

    for (const combintaion of combinations) {
      const iterations = dray2(points, clusters, combintaion);
      const iteration = iterations[iterations.length - 1];
      calcSums(iteration);
      const sum = iteration.reduce((p, v) => p + v.sum, 0);

      allIterations.push({
        begin: combintaion,
        result: iteration,
        itertations: iterations.length,
        sum,
      });
    }
    console.log(allIterations);

    const sums = allIterations.map((x) => x.sum);
    const bestIndex = sums.indexOf(Math.min(...sums));
    const worstIndex = sums.indexOf(Math.max(...sums));
    const result = allIterations[bestIndex].result;
    const worstResult = allIterations[worstIndex].result;
    console.log(allIterations[bestIndex]);
    updateIterations([result, worstResult]);
    updateSelectdIteration(0);

    handleProcessAndreyCommon({ result, index });
    iter = index;
    const end = performance.now();
    time = Math.round((end - start) * 1000) / 1000;
  }

  function handleSelectedIterationChange(event) {
    const index = +event.target.value;
    const result = iterations[index];
    updateSelectdIteration(index);
    handleProcessAndreyCommon({ result, index });
  }

  let matrix = undefined;

  if ((result as any).matrix) {
    matrix = (
      <table className="table">
        <tbody>
          {(result as any).matrix.map((l, li) => (
            <tr key={li}>
              {l.map((c, ci) => (
                <td key={ci}>{c && Math.round(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="p-2">
      <div>
        <canvas
          ref={canvas}
          style={{ border: '1px solid' }}
          height="500"
          width="500"
          onClick={handleClick}
        ></canvas>
      </div>
      <div className="mb-3">
        <input value={clusters} onChange={handleClustersChange} />
        <select
          style={{ width: '10rem' }}
          value={selectdIteration}
          onChange={handleSelectedIterationChange}
        >
          {iterations.map((iter, index) => (
            <option value={index} key={index}>
              {index}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <button
          className="btn btn-primary btn-sm me-2 "
          onClick={handleProcessKmeans}
        >
          KMeans
        </button>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleProcessAndre2}
        >
          KMeans f.
        </button>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleProcessDray2}
        >
          Alpha 3
        </button>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleProcessRandomDray2}
        >
          Random Alpha 3
        </button>

        {iter ? `Interations: ${iter - 1}, ` : ''}
        {time ? `Time: ${time}` : ''}
      </div>
      <div className="mb-3">
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleClearResult}
        >
          Clear process result
        </button>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleClearData}
        >
          Clear process data
        </button>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handleRemoveLastPoint}
        >
          Remove last point
        </button>
      </div>
      <div style={{ display: 'flex' }}>
        <div className="me-3">
          <Points points={points} onPointsChange={handlePointsChange} />
        </div>
        <div>
          <Groups result={result} />
        </div>
      </div>
      <div>{matrix}</div>
    </div>
  );
}
