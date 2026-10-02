const fs = require('fs');
let content = fs.readFileSync('src/pages/Customers/CustomerDetails.tsx', 'utf8');

content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
content = content.replace(/\/\*[\s\S]*?\*\//g, "");

content = content.replace(/\{isDeleting \? 'Deleting[^']*' : 'Delete Customer'\}/g, "{isDeleting ? 'Deleting...' : 'Delete Customer'}");
content = content.replace(/\{formatDate\(payment\.paymentDate\)\} [^\{]*\{payment\.paymentMethod\}/g, "{formatDate(payment.paymentDate)} \u2022 {payment.paymentMethod}");
content = content.replace(/\{payment\.creditBill && ` [^B]*Bill #\$\{payment\.creditBill\.billNumber\}`\}/g, "{payment.creditBill && ` \u2022 Bill #${payment.creditBill.billNumber}`}");

fs.writeFileSync('src/pages/Customers/CustomerDetails.tsx', content, 'utf8');
console.log("Fixed comments in CustomerDetails.tsx");
