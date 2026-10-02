const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');
index = index.replace(/<!-- .*? -->\n/g, "");
fs.writeFileSync('index.html', index, 'utf8');

let vite = fs.readFileSync('vite.config.ts', 'utf8');
vite = vite.replace(/\/\/ .*?\n/g, "");
fs.writeFileSync('vite.config.ts', vite, 'utf8');
console.log("Fixed HTML and Vite");
