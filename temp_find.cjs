const fs = require('fs');
const lines = fs.readFileSync('src/pages/Customers/CustomerDetails.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
    console.log(`[${i+1}] ${Buffer.from(l.trim(), 'utf8').toString('base64')}`);
  }
});
