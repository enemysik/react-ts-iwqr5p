import * as React from 'react';
import { colors } from './colors';
import { distance, Result } from './utils';

export default function Groups({ result }: Prop) {
  result.forEach((g) => {
    let sum = 0;
    for (let i = 0; i < g.points.length; i++) {
      for (let j = i; j < g.points.length; j++) {
        sum += distance(g.points[i], g.points[j]);
      }
    }
    g.sum2 = sum;
  });

  return (
    <div>
      <table style={{ marginTop: '4.45rem' }} className="table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Count</th>
            <th>Sum</th>
            <th>Sum2</th>
          </tr>
        </thead>
        <tbody>
          {result.map((s, i) => (
            <tr key={i}>
              <td>
                <span
                  style={{
                    backgroundColor: colors[i],
                    display: 'block',
                    height: '1rem',
                  }}
                ></span>
              </td>
              <td>{s.points?.length}</td>
              <td>{Math.round(s.sum)}</td>
              <td>{Math.round(s.sum2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Average sum:{' '}
        {Math.round(result.reduce((p, v) => p + v.sum, 0) / result.length)}
      </p>

      <p>
        Average sum2:{' '}
        {Math.round(result.reduce((p, v) => p + v.sum2, 0) / result.length)}
      </p>
    </div>
  );
}

interface Prop {
  result: Result;
}
