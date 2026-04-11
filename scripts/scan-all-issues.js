#!/usr/bin/env node

/**
 * Comprehensive Issue Scanner
 * Scans for all types of issues that could cause build failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

const issues = {
  typescript: [],
  imports: [],
  exports: [],
  syntax: [],
  jsx: [],
  dependencies: [],
  other: []
};

// Scan TypeScript errors
function scanTypeScript() {
  console.log(colorize('\n📋 Scanning TypeScript errors...', 'blue'));
  try {
    const output = execSync('npx tsc --noEmit --pretty false 2>&1', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    if (output && output.includes('error TS')) {
      const errorLines = output.split(/\r?\n/).filter(line => line.includes('error TS'));
      errorLines.forEach(line => {
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
        if (match) {
          issues.typescript.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: match[4],
            message: match[5]
          });
        }
      });
    }
  } catch (error) {
    // TypeScript errors are expected if there are issues
  }
}

// Scan for missing imports
function scanImports() {
  console.log(colorize('🔍 Scanning for import issues...', 'blue'));
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) return;

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Check for import statements
      const importLines = content.split(/\r?\n/).map((line, idx) => ({
        line: line.trim(),
        number: idx + 1
      })).filter(l => l.line.startsWith('import'));

      importLines.forEach(({ line, number }) => {
        // Check for relative imports that might be broken
        const relativeMatch = line.match(/from\s+['"](\.\.?\/[^'"]+)['"]/);
        if (relativeMatch) {
          const importPath = relativeMatch[1];
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);

          // Check if file exists
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
          let found = false;

          for (const ext of possibleExtensions) {
            if (fs.existsSync(resolvedPath + ext)) {
              found = true;
              break;
            }
          }

          if (!found && !importPath.includes('node_modules')) {
            issues.imports.push({
              file: relativePath,
              line: number,
              import: importPath,
              message: `Import path may not exist: ${importPath}`
            });
          }
        }

        // Check for @/ imports (should be configured in tsconfig)
        if (line.includes("from '@/") || line.includes('from "@/')) {
          // These should be fine if tsconfig is set up correctly
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        scanFile(filePath);
      }
    });
  }

  scanDirectory(srcDir);
}

// Scan for JSX issues
function scanJSX() {
  console.log(colorize('⚛️  Scanning for JSX issues...', 'blue'));
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) return;

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);

      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;

      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
      );

      const diagnostics = sourceFile.parseDiagnostics || [];
      diagnostics.forEach((diagnostic) => {
        const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
        issues.jsx.push({
          file: relativePath,
          line: position.line + 1,
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        scanFile(filePath);
      }
    });
  }

  scanDirectory(srcDir);
}

// Scan for syntax issues
function scanSyntax() {
  console.log(colorize('🔤 Scanning for syntax issues...', 'blue'));
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) return;

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      const lines = content.split(/\r?\n/);

      lines.forEach((line, idx) => {
        // Check for unbalanced brackets
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;

        // Skip if it's a string or comment
        if (line.includes('//') || line.includes('/*') || line.match(/['"`]/)) {
          return;
        }

        if (Math.abs(openBraces - closeBraces) > 2) {
          issues.syntax.push({
            file: relativePath,
            line: idx + 1,
            message: 'Potentially unbalanced braces'
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        scanFile(filePath);
      }
    });
  }

  scanDirectory(srcDir);
}

// Scan for missing exports
function scanExports() {
  console.log(colorize('📤 Scanning for export issues...', 'blue'));
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) return;

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Check for files that export but might have issues
      const hasExport = content.includes('export ');
      const hasDefaultExport = content.includes('export default');

      // Check for index files that should re-export
      if (filePath.endsWith('index.ts') || filePath.endsWith('index.tsx')) {
        if (!hasExport && !hasDefaultExport) {
          issues.exports.push({
            file: relativePath,
            message: 'Index file has no exports'
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        scanFile(filePath);
      }
    });
  }

  scanDirectory(srcDir);
}

// Main function
function main() {
  console.log(colorize('\n🔍 Comprehensive Issue Scanner\n', 'cyan'));
  console.log(colorize('='.repeat(60), 'blue'));

  const startTime = Date.now();

  // Run all scans
  scanTypeScript();
  scanImports();
  scanJSX();
  scanSyntax();
  scanExports();

  // Display results
  console.log(colorize('\n' + '='.repeat(60), 'blue'));
  console.log(colorize('\n📊 Scan Results:\n', 'bold'));

  let totalIssues = 0;

  // TypeScript errors
  if (issues.typescript.length > 0) {
    totalIssues += issues.typescript.length;
    console.log(colorize(`❌ TypeScript Errors: ${issues.typescript.length}`, 'red'));
    issues.typescript.slice(0, 5).forEach(error => {
      console.log(`   ${error.file}:${error.line} - ${error.message}`);
    });
    if (issues.typescript.length > 5) {
      console.log(colorize(`   ... and ${issues.typescript.length - 5} more`, 'yellow'));
    }
  } else {
    console.log(colorize('✅ TypeScript Errors: 0', 'green'));
  }

  // Import issues
  if (issues.imports.length > 0) {
    totalIssues += issues.imports.length;
    console.log(colorize(`\n⚠️  Import Issues: ${issues.imports.length}`, 'yellow'));
    issues.imports.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
    });
    if (issues.imports.length > 5) {
      console.log(colorize(`   ... and ${issues.imports.length - 5} more`, 'yellow'));
    }
  } else {
    console.log(colorize('\n✅ Import Issues: 0', 'green'));
  }

  // JSX issues
  if (issues.jsx.length > 0) {
    totalIssues += issues.jsx.length;
    console.log(colorize(`\n⚠️  JSX Issues: ${issues.jsx.length}`, 'yellow'));
    issues.jsx.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
    });
    if (issues.jsx.length > 5) {
      console.log(colorize(`   ... and ${issues.jsx.length - 5} more`, 'yellow'));
    }
  } else {
    console.log(colorize('\n✅ JSX Issues: 0', 'green'));
  }

  // Syntax issues
  if (issues.syntax.length > 0) {
    totalIssues += issues.syntax.length;
    console.log(colorize(`\n⚠️  Syntax Issues: ${issues.syntax.length}`, 'yellow'));
    issues.syntax.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
    });
    if (issues.syntax.length > 5) {
      console.log(colorize(`   ... and ${issues.syntax.length - 5} more`, 'yellow'));
    }
  } else {
    console.log(colorize('\n✅ Syntax Issues: 0', 'green'));
  }

  // Export issues
  if (issues.exports.length > 0) {
    totalIssues += issues.exports.length;
    console.log(colorize(`\n⚠️  Export Issues: ${issues.exports.length}`, 'yellow'));
    issues.exports.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.file} - ${issue.message}`);
    });
    if (issues.exports.length > 5) {
      console.log(colorize(`   ... and ${issues.exports.length - 5} more`, 'yellow'));
    }
  } else {
    console.log(colorize('\n✅ Export Issues: 0', 'green'));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(colorize('\n' + '='.repeat(60), 'blue'));
  console.log(colorize(`\n⏱️  Scan completed in ${duration}s`, 'cyan'));
  console.log(colorize(`📈 Total issues found: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green'));
  console.log(colorize('='.repeat(60) + '\n', 'blue'));

  process.exit(totalIssues > 0 ? 1 : 0);
}

main();

