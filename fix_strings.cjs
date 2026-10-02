const fs = require('fs');
const path = require('path');
function replaceInFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        let stat = fs.statSync(fullPath);
        if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Replace the chart tick formatter garbage with Rupee
            content = content.replace(/tickFormatter=\{\(v\) => `[^$]*\$\{\(v \/ 1000\)\.toFixed\(0\)\}k`\}/g, "tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}");
            
            // Replace "View all [GARBAGE]" with "View all →"
            content = content.replace(/View all [^\n<"']*/g, "View all →");
            
            // Replace "Last 7 Days [GARBAGE] Sales Overview"
            content = content.replace(/Last 7 Days[^a-zA-Z0-9]*Sales Overview/g, "Last 7 Days — Sales Overview");
            
            // Replace generic payment.customer fallback garbage
            content = content.replace(/payment\.customer\?\.name \|\| '[^']*'/g, "payment.customer?.name || 'Unknown'");
            
            // Replace bill reference garbage: ` [GARBAGE] Bill #...`
            content = content.replace(/`[^$]*Bill #\$\{/g, "`• Bill #${");
            
            // Replace date separator garbage: `${...} [GARBAGE] ${...}`
            content = content.replace(/sub=\{`\$\{([a-zA-Z0-9.?]+)\}[^$]*\$\{([a-zA-Z0-9.?()]+)\}`\}/g, "sub={`\\${$1} • \\${$2}`}");
            
            // Replace generic 'See all [GARBAGE]'
            content = content.replace(/See all [^\n<"']*/g, "See all →");
            
            // Replace generic 'View details [GARBAGE]'
            content = content.replace(/View details [^\n<"']*/g, "View details →");
            
            // Replace any other weird long mojibake inside strings
            // A pattern like A'A+... or ÃƒÆ’...
            content = content.replace(/[AÃ][ƒ][^'"`<>]*?(?=['"`<>])/g, (match) => {
                if (match.length > 5) return "";
                return match;
            });
            
            if (original !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log("Fixed: " + fullPath);
            }
        } else if (stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'dist') {
            replaceInFiles(fullPath);
        }
    });
}
replaceInFiles('./src');
