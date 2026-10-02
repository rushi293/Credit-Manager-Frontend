import fs from 'fs';

const filePath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire Recent Activity block
const recentActivityRegex = /<h3 className="text-base font-semibold text-gray-900 mb-5">Recent Activity<\/h3>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/main>)/;

const newActivityBlock = `<h3 className="text-base font-semibold text-gray-900 mb-5">Recent Activity</h3>
              {recentPayments.length === 0 && recentBills.length === 0 ? (
                <EmptyActivity />
              ) : (
                <div className="space-y-4">
                  {recentPayments.slice(0, 3).map((payment) => (
                    <ActivityRow
                      key={\`pay-\${payment.id}\`}
                      iconBg="bg-emerald-50"
                      icon={<ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
                      title="Payment received"
                      sub={\`\${payment.customer?.name || 'Unknown'} • \${formatDate(payment.paymentDate)}\`}
                      right={<span className="text-sm font-semibold text-emerald-600">+{formatCurrency(payment.amount)}</span>}
                    />
                  ))}
                  {recentBills.slice(0, 3).map((bill) => (
                    <ActivityRow
                      key={\`bill-\${bill.id}\`}
                      iconBg="bg-indigo-50"
                      icon={<FileText className="h-3.5 w-3.5 text-indigo-600" />}
                      title={\`Bill #\${bill.billNumber}\`}
                      sub={\`\${bill.customer?.name || 'Unknown'} • \${formatDate(bill.billDate)}\`}
                      right={<span className="text-sm font-semibold text-gray-900">{formatCurrency(bill.totalAmount)}</span>}
                    />
                  ))}
                </div>
              )}
            </div>`;

content = content.replace(recentActivityRegex, newActivityBlock);

// Wipe anything left over that looks like A or A'A
content = content.replace(/A'A\+.*?A\?/g, '');
content = content.replace(/[A-Za-z0-9_]*A[A-Za-z0-9_',.\?sA]*/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Recent Activity fixed");
