import * as React from 'react';
import { Point } from './utils';
import { colors } from './colors';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

interface Prop {
  points: Point[];
  onPointsChange: (paints: Point[]) => void;
}

export default function Points({ points, onPointsChange }: Prop) {
  const fileInput = React.useRef<HTMLInputElement>(null);

  async function handleExport() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data');

    points.forEach((point, i) => {
      const xCell = worksheet.getCell(i + 1, 1);
      xCell.value = point.x;
      const yCell = worksheet.getCell(i + 1, 2);
      yCell.value = point.y;
    });

    const xls64 = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([xls64]), 'data.xlsx');
  }

  function handleImport() {
    fileInput.current.click();
    // const workbook = new Workbook();
    // await workbook.xlsx.read()
  }

  async function handleFileSelect() {
    if (!fileInput.current.files.length) {
      return;
    }
    const file = fileInput.current.files.item(0);

    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const workbook = new Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);
      const readedPoints = [];
      for (const row of worksheet.getRows(
        worksheet.dimensions.top,
        worksheet.dimensions.bottom
      )) {
        const xCell = row.getCell(1);
        const yCell = row.getCell(2);
        readedPoints.push({ x: +xCell.value, y: +yCell.value });
      }
      onPointsChange(readedPoints);
    };
  }

  return (
    <div>
      <input
        ref={fileInput}
        type="file"
        style={{ display: 'none' }}
        multiple={false}
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileSelect}
      />
      <button className="btn btn-primary btn-sm me-2" onClick={handleImport}>
        Import
      </button>
      <button className="btn btn-primary btn-sm me-2" onClick={handleExport}>
        Export
      </button>
      <p>Total points: {points.length}</p>
      <table className="table">
        <thead>
          <tr>
            <th>X</th>
            <th>Y</th>
            <th>Group</th>
            <th>Color</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{p.x}</td>
              <td>{p.y}</td>
              <td>{p.cluster}</td>
              <td>
                <span
                  style={{
                    backgroundColor: colors[p.cluster],
                    display: 'block',
                    height: '1rem',
                  }}
                ></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
