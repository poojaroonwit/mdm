const fs = require('fs');
const path = require('path');
function walkDir(dir, cb) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    fs.statSync(p).isDirectory() ? walkDir(p, cb) : cb(p);
  });
}
walkDir('./src/app/admin/features', p => {
  if (p.endsWith('.tsx')) {
    const c = fs.readFileSync(p, 'utf8');
    const lines = c.split('\n');
    lines.forEach((l, i) => {
      // Find full loaders, avoid inline string templating like `animate-spin` inside `${}`
      if (l.includes('animate-spin') && !l.includes('${')) {
        console.log('---', p, ':', i);
        console.log(lines.slice(Math.max(0, i-2), i+3).join('\n'));
      }
    });
  }
});
