const tests = [
  ['http://localhost:3000/product/altera/10AT115U2F45E2SGES', 'Altera product'],
  ['http://localhost:3000/product/texas-instruments/TPS54560BDDA', 'TI product'],
  ['http://localhost:3000/', 'Homepage'],
];
for (const [url, label] of tests) {
  try {
    const r = await fetch(url);
    console.log(r.status, label, url);
  } catch(e) { console.log('ERR', label, e.message); }
}
