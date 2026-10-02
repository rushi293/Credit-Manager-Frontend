const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            let lines = content.split('\n');
            lines.forEach((l, i) => {
                if (l.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
                    console.log(`[${filePath}:${i+1}] ${Buffer.from(l.trim(), 'utf8').toString('base64')}`);
                }
            });
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
