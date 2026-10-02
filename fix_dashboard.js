import fs from 'fs';
import path from 'path';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\/\/ AA.*?DEMO \/ PREVIEW DATA.*?A\s+/gs, '');
content = content.replace(/\/\/ AAA,A\?.*?A\s+/gs, '');
content = content.replace(/Last 7 Days[\s\S]*?Sales Overview/g, 'Last 7 Days — Sales Overview');
content = content.replace(/View all A[\s\S]*?A/g, 'View all ?');
content = content.replace(/tickFormatter=\{\(v\) => `A[\s\S]*?\$\{\(v \/ 1000\)\.toFixed\(0\)\}k`\}/g, 'tickFormatter={(v) => `?${(v / 1000).toFixed(0)}k`}');
content = content.replace(/sub=\{\`\$\{payment\.customer\?\.name\} A[\s\S]*?\$\{formatDate\(payment\.paymentDate\)\}\`\}/g, 'sub={`${payment.customer?.name} • ${formatDate(payment.paymentDate)}`}');
content = content.replace(/sub=\{\`\$\{bill\.customer\?\.name\} A[\s\S]*?\$\{formatDate\(bill\.billDate\)\}\`\}/g, 'sub={`${bill.customer?.name} • ${formatDate(bill.billDate)}`}');

// Fix the View all arrow again if the regex missed it because it didn't end in A
content = content.replace(/View all A'A\+\?T[\s\S]*?A/g, 'View all ?');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Dashboard.tsx cleaned");
