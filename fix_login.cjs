const fs = require('fs');
let content = fs.readFileSync('src/pages/Auth/Login.tsx', 'utf8');
content = content.replace(/Signing in.*/, "Signing in...");
fs.writeFileSync('src/pages/Auth/Login.tsx', content, 'utf8');
console.log("Fixed Login.tsx");
