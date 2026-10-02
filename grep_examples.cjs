const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.html'))) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('View all') || content.includes('1300') || content.includes('Sales Overview') || content.includes('SÄ')) {
                console.log('Matches in ' + filePath);
                const lines = content.split('\n');
                lines.forEach((l, i) => {
                    if (l.includes('View all') || l.includes('1300') || l.includes('Sales Overview') || l.includes('SÄ')) {
                        console.log(`  [${i+1}] ${l.trim()}`);
                    }
                });
            }
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
walkSync('./');
