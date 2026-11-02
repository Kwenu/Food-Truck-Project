type Cell = string | number;

export function toCsv(rows: Cell[][]): string {
  return rows.
  map((row) =>
  row.
  map((cell) => {
    const s = String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).
  join(',')
  ).
  join('\n');
}

export function downloadCsv(filename: string, rows: Cell[][]): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}