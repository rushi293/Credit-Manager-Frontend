const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/LoadingA.*/, "Loading...");
// Also fix the huge comment block
content = content.replace(/\/\/ A[^\n]*\n/g, "");
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Fixed App.tsx");
