const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports/index.tsx', 'utf8');
content = content.replace(/tickFormatter=\{\(v\) => ``\}/g, "tickFormatter={(v: any) => `\u20B9${(v / 1000).toFixed(0)}k`}");
fs.writeFileSync('src/pages/Reports/index.tsx', content, 'utf8');
console.log("Fixed Reports/index.tsx");
