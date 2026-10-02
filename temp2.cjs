const fs = require('fs');
const content = fs.readFileSync('src/pages/Customers/CustomerDetails.tsx', 'utf8');
if (content.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
    console.log("Mojibake found!");
} else {
    console.log("No mojibake found.");
}
