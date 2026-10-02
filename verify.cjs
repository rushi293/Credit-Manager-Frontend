const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('Last 7 Days') || content.includes('Ice Cream')) {
                console.log('Matches in ' + filePath);
                const lines = content.split('\n');
                lines.forEach((l, i) => {
                    if (l.includes('Last 7 Days') || l.includes('Ice Cream')) {
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
