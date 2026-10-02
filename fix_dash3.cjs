const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Fix the tickFormatters
content = content.replace(/tickFormatter=\{\(v\) => `[^$]*\$\{\(v \/ 1000\)\.toFixed\(0\)\}k`\}/g, "tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}");

// Fix the YAxis formatting for creditChartData
content = content.replace(/tickFormatter=\{\(v\) => `[^$]*\$\{\(v \/ 1000\)\.toFixed\(0\)\}k`\}/g, "tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}");

// View all
content = content.replace(/View all [^\n<"']*/g, "View all \u2192");

// Last 7 Days
content = content.replace(/Last 7 Days[^a-zA-Z0-9]*Sales Overview/g, "Last 7 Days \u2014 Sales Overview");

// Payment customer fallback
content = content.replace(/payment\.customer\?\.name \|\| '[^']*'/g, "payment.customer?.name || 'Unknown'");

// sub text with bullet points (the garbage was previously caught by my regex)
// Let's just find `...customer?.name} [GARBAGE] ${formatDate...`
content = content.replace(/customer\?\.name\} [^$]* \$\{formatDate/g, "customer?.name} \u2022 ${formatDate");

// For recent bills
content = content.replace(/customer\?\.name\} [^$]* \$\{formatDate/g, "customer?.name} \u2022 ${formatDate");

// Bill reference: A'A... Bill #...
content = content.replace(/` [^$]*Bill #\$\{/g, "` \u2022 Bill #${");

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log("Fixed Dashboard.tsx");
