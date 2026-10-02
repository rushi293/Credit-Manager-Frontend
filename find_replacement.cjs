const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('')) {
                console.log('Found  in ' + filePath);
            }
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
