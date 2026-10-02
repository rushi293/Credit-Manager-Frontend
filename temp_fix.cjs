const fs = require('fs');
let content = fs.readFileSync('src/pages/Customers/CustomerDetails.tsx', 'utf8');

// Fix paymentDate string
content = content.replace(/\{formatDate\(payment\.paymentDate\)\} [^\{]*\{payment\.paymentMethod\}/g, "{formatDate(payment.paymentDate)} \u2022 {payment.paymentMethod}");

// Fix creditBill
content = content.replace(/\{payment\.creditBill && ` [^B]*Bill #\$\{payment\.creditBill\.billNumber\}`\}/g, "{payment.creditBill && ` \u2022 Bill #${payment.creditBill.billNumber}`}");

// Fix Deleting...
content = content.replace(/\{isDeleting \? 'Deleting[^\']*' : 'Delete Customer'\}/g, "{isDeleting ? 'Deleting...' : 'Delete Customer'}");

// Remove commented out garbage blocks
content = content.replace(/\{\/\* [^\n]* \*\/\}/g, (match) => {
    if (match.includes("Delete Confirmation Dialog") || match.includes("Cannot Delete Notification Dialog")) {
        return match.replace(/ÃƒÆ’[^\s]*/g, "");
    }
    // Just delete any comment with mojibake
    if (match.match(/Ã|Â|â|ä|å|Æ|ƒ|‚|™|š|€|SÄ/)) {
        return "";
    }
    return match;
});

fs.writeFileSync('src/pages/Customers/CustomerDetails.tsx', content, 'utf8');
console.log("Cleaned CustomerDetails.tsx");
