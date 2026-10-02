const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(/\?/g, "\u2022");
content = content.replace(/payment\.customer\?\.name \|\| '[^']*'/g, "payment.customer?.name || 'Unknown'");
content = content.replace(/Unknown\} • \$\{formatDate/g, "Unknown'} \u2022 ${formatDate");
fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log("Fixed Dashboard.tsx");
