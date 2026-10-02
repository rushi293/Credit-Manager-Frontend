import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let newContent = content;

// Replace all YAxis completely
newContent = newContent.replace(/<YAxis[\s\S]*?dx=\{-10\}\s*\/>/g, 
  `<YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(v) => \`?${(v / 1000).toFixed(0)}k\`}
                    dx={-10}
                  />`);

newContent = newContent.replace(/<YAxis[\s\S]*?dx=\{-4\}\s*width=\{52\}\s*\/>/g, 
  `<YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => \`?${(v / 1000).toFixed(0)}k\`} dx={-4} width={52} />`);

if (newContent !== content) {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log("YAxis successfully replaced");
} else {
  console.log("No changes made to YAxis!");
}
