const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'docs', 'test-cases-user-product.csv');
const outPath = path.join(process.cwd(), 'docs', 'test-cases-user-product.xlsx');

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split(/\r?\n/);
if (lines.length === 0) {
  console.error('CSV is empty');
  process.exit(1);
}
const headers = lines[0].split(',');
const data = lines.slice(1).map(line => {
  // naive split - assumes no embedded commas in fields
  const cols = line.split(',');
  const obj = {};
  headers.forEach((h, i) => { obj[h] = cols[i] === undefined ? '' : cols[i]; });
  return obj;
});

const ws = xlsx.utils.json_to_sheet(data, {header: headers});
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'TestCases');

xlsx.writeFile(wb, outPath);
console.log('Wrote xlsx to', outPath);
