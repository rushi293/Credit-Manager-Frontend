const fs = require('fs');
let content = fs.readFileSync('src/pages/Customers/CustomerDetails.tsx', 'utf8');
content = content.replace(/\{formatDate\(payment\.paymentDate\)\} `.*?\}/, "{formatDate(payment.paymentDate)} {payment.creditBill && `\u2022 Bill #${payment.creditBill.billNumber}`}");
// Wait, looking at the syntax errors:
// src/pages/Customers/CustomerDetails.tsx(355,1): error TS1005: '}' expected.
// Did I mess up ConfirmDialog?
