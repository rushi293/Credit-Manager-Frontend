const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && !filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist') && !filePath.includes('public') && !filePath.includes('assets') && !filePath.endsWith('.js') && !filePath.endsWith('.cjs')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (l.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
                    console.log(`[${filePath}:${i+1}] ${l.trim()}`);
                }
            });
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
