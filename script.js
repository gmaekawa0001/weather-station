const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace standard colors with dark mode variants
code = code.replaceAll('bg-slate-100', 'bg-slate-100 dark:bg-slate-900');
code = code.replaceAll('bg-white', 'bg-white dark:bg-slate-800');
code = code.replaceAll('text-slate-800', 'text-slate-800 dark:text-slate-100');
code = code.replaceAll('text-slate-900', 'text-slate-900 dark:text-white');
code = code.replaceAll('text-slate-500', 'text-slate-500 dark:text-slate-400');
code = code.replaceAll('text-slate-700', 'text-slate-700 dark:text-slate-200');
code = code.replaceAll('border-slate-200', 'border-slate-200 dark:border-slate-700');
code = code.replaceAll('bg-slate-50', 'bg-slate-50 dark:bg-slate-800/50');
code = code.replaceAll('text-slate-600', 'text-slate-600 dark:text-slate-300');

// Fix dark mode double replacements if any
code = code.replaceAll('dark:bg-slate-900 dark:bg-slate-900', 'dark:bg-slate-900');

// Update lastUpdate formatting to remove seconds
code = code.replace(
  /setLastUpdate\(dateObj\.toLocaleTimeString\('pt-BR'\)\);/g,
  "setLastUpdate(dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));"
);

// Add Sun icon import
if (!code.includes('Sun,')) {
  code = code.replace('Moon,', 'Moon,\n  Sun,');
}

// Add state for dark mode
if (!code.includes('const [isDarkMode, setIsDarkMode]')) {
  code = code.replace(
    /const \[lastUpdate, setLastUpdate\] = useState\(\"\"\);/,
    `const [lastUpdate, setLastUpdate] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);`
  );
}

// Replace Moon button with toggle
code = code.replace(
  /<button className="p-2 text-slate-400[^"]+">\s*<Moon className="w-6 h-6" \/>\s*<\/button>/g,
  `<button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>`
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Modifications applied!');
