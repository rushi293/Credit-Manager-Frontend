const fs = require('fs');
const path = require('path');
function replaceCorruptStrings(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        let stat = fs.statSync(fullPath);
        if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.html'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Fix â‚¹ to ₹
            content = content.replace(/â‚¹/g, "₹");
            
            // Fix ä€ to — (em-dash)
            content = content.replace(/ä€/g, "—");
            content = content.replace(/ä€“/g, "—");
            
            // Fix SÄ,Ä to ₹
            content = content.replace(/SÄ,Ä/g, "₹");
            
            // Fix any other known weird sequences
            content = content.replace(/ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹/g, "₹");
            content = content.replace(/ÃƒÆ’Ã†â€™[^<"']*/g, ""); // strip the view all garbage
            
            // The ",A,..." garbage
            content = content.replace(/A,A,[^<"']*/g, "");
            
            if (original !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log("Fixed manually mapped mojibake in: " + fullPath);
            }
        } else if (stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'dist') {
            replaceCorruptStrings(fullPath);
        }
    });
}
replaceCorruptStrings('./src');
