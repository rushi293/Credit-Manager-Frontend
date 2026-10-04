const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyBills/components/DailyBillForm.tsx', 'utf8');

// 1. Add selectedIndex state
content = content.replace(
  'const [isDropdownOpen, setIsDropdownOpen] = useState(false);',
  'const [isDropdownOpen, setIsDropdownOpen] = useState(false);\n  const [selectedIndex, setSelectedIndex] = useState(0);'
);

// 2. Reset selectedIndex when search changes
content = content.replace(
  'setSearch(e.target.value);\n                  setIsDropdownOpen(true);',
  'setSearch(e.target.value);\n                  setIsDropdownOpen(true);\n                  setSelectedIndex(0);'
);

// 3. Add onKeyDown to input
content = content.replace(
  'onFocus={() => setIsDropdownOpen(true)}\n                className="w-full',
  \onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (!isDropdownOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setIsDropdownOpen(true);
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCustomers[selectedIndex]) {
                      const selectedC = filteredCustomers[selectedIndex];
                      setValue('customerId', selectedC.id, { shouldValidate: true });
                      setSearch(selectedC.name);
                      setIsDropdownOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsDropdownOpen(false);
                  }
                }}
                className="w-full\
);

// 4. Update the map rendering to highlight selectedIndex
content = content.replace(
  'filteredCustomers.map(c => (',
  'filteredCustomers.map((c, idx) => ('
);

content = content.replace(
  'className="px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors"',
  'className={\px-4 py-2 text-sm cursor-pointer transition-colors \\}'
);

// 5. Update selectedIndex on hover
content = content.replace(
  'onClick={() => {',
  'onMouseEnter={() => setSelectedIndex(idx)}\n                        onClick={() => {'
);

fs.writeFileSync('src/pages/DailyBills/components/DailyBillForm.tsx', content, 'utf8');
