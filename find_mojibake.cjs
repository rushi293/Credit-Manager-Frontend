const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && !filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
                console.log('Found mojibake in ' + filePath);
            }
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist') {
            walkSync(filePath);
        }
    });
}
walkSync('./');
