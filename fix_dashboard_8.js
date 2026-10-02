import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\{payment\.customer\?\.name \|\| 'A[\s\S]*?'\}/g, "{payment.customer?.name || 'Unknown'}");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Cleaned Recent Payments fallback name in Dashboard.tsx");
