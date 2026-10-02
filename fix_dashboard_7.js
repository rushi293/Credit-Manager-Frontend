import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. tickFormatter
content = content.replace(/tickFormatter=\{\(v\) => \`A[\s\S]*?\$\{\(v \/ 1000\)\.toFixed\(0\)\}k\`\}/g, "tickFormatter={(v) => `?${(v / 1000).toFixed(0)}k`}");

// 2. Last 7 Days
content = content.replace(/Last 7 Days[\s\S]*?Sales Overview/g, "Last 7 Days \u2014 Sales Overview");

// 3. View all A...
content = content.replace(/View all A[\s\S]*?(?=<\/Link>)/g, "View all \u2192\n              ");

// 4. payment.customer?.name
content = content.replace(/sub=\{\`\$\{payment\.customer\?\.name\}[\s\S]*?\$\{formatDate\(payment\.paymentDate\)\}\`\}/g, "sub={`${payment.customer?.name} \u2022 ${formatDate(payment.paymentDate)}`}");

// 5. bill.customer?.name
content = content.replace(/sub=\{\`\$\{bill\.customer\?\.name\}[\s\S]*?\$\{formatDate\(bill\.billDate\)\}\`\}/g, "sub={`${bill.customer?.name} \u2022 ${formatDate(bill.billDate)}`}");

// 6. Huge DEMO / PREVIEW block at bottom
content = content.replace(/\/\/ AA.*?DEMO \/ PREVIEW DATA.*?A\s+/gs, '');
content = content.replace(/\/\/ AAA,A\?.*?A\s+/gs, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Safely cleaned Dashboard.tsx");
