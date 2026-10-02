import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Wipe the entire tickFormatter and replace it
content = content.replace(/tickFormatter=\{\(v\) => `A[\s\S]*?\$\{\(v \/ 1000\)\.toFixed\(0\)\}k`\}/g, 'tickFormatter={(v) => `?${(v / 1000).toFixed(0)}k`}');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Dashboard cleaned aggressively");
