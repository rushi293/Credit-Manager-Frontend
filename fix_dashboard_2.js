import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The massive block of mojibake
content = content.replace(/A'A\+\?T[\s\S]*?MetricCardProps/g, 'interface MetricCardProps');

// Just in case it's lingering elsewhere
content = content.replace(/A'A\+\?T[\s\S]*?(?=<\/h3>)/g, '');
content = content.replace(/A'A\+\?T[\s\S]*?(?=\}\`\})/g, '');
content = content.replace(/View all A[\s\S]*?A/g, 'View all ?');
content = content.replace(/View all A'A\+\?T[\s\S]*?<\/Link>/g, 'View all ?\n              </Link>');

// Let's also verify "Last 7 Days"
content = content.replace(/Last 7 Days  Sales Overview/g, 'Last 7 Days — Sales Overview');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Dashboard cleaned aggressively");
