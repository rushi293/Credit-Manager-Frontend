const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (l.match(/decodeURIComponent|encodeURIComponent|TextDecoder|TextEncoder|escape|unescape|btoa|atob|utf8|latin1|fixEncoding|decode/i)) {
                    console.log(`[${filePath}:${i+1}] ${l.trim()}`);
                }
            });
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
