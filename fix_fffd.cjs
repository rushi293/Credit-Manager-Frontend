const fs = require('fs');
const path = require('path');
function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            let orig = content;
            if (content.includes('\uFFFD')) {
                // Fix "Signing in..."
                content = content.replace(/Signing in\uFFFD\?\uFFFD/g, "Signing in...");
                content = content.replace(/Loading\uFFFD\?\uFFFD/g, "Loading...");
                // Fix bullet points "name ? date" -> "name • date"
                content = content.replace(/\uFFFD\?\uFFFD/g, "•");
                
                if (orig !== content) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log("Fixed U+FFFD in " + filePath);
                } else {
                    console.log("Found U+FFFD in " + filePath + " but no rule matched.");
                }
            }
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'dist' && name !== 'public') {
            walkSync(filePath);
        }
    });
}
walkSync('./src');
