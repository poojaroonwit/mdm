const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir('./src/app/admin/features', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern to catch the wrapper <div> that contains animate-spin. 
    // Usually `<div className="... py-8 ...">` or `<div className="... items-center justify-center ...">`
    // We match from `<div ` down to the closing `</div>` of the outer div, by checking for `animate-spin` inside.
    
    // Non-greedy match of a div that contains an inner div with animate-spin, and may contain a <p> or <span> after.
    const spinnerRegex = /<div className=\"([^\"]*(?:py-\d+|justify-center|text-center)[^\"]*)\">\s*<div className=\"animate-spin[^\"]*?\"(?:\s*\/>|>.*?<\/div>)(?:\s*<p[^>]*?>.*?<\/p>|\s*<span[^>]*?>.*?<\/span>|\s*(?:Loading.*?))?\s*<\/div>/gs;

    let hasReplaced = false;

    const skeletonTemplate = `<div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>`;

    content = content.replace(spinnerRegex, (match) => {
        // Double check it doesn't match something too huge
        if (match.length > 500) return match;
        
        hasReplaced = true;
        return skeletonTemplate;
    });

    if (hasReplaced || content !== original) {
        if (!content.includes("import { Skeleton }") && hasReplaced) {
             const lines = content.split('\n');
             let lastImportIndex = -1;
             for (let i = 0; i < lines.length; i++) {
                 if (lines[i].trim().startsWith('import ')) {
                     lastImportIndex = i;
                 }
             }
             if (lastImportIndex !== -1) {
                 lines.splice(lastImportIndex + 1, 0, "import { Skeleton } from '@/components/ui/skeleton'");
                 content = lines.join('\n');
             } else {
                 content = "import { Skeleton } from '@/components/ui/skeleton'\n" + content;
             }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles++;
        console.log('Modified:', filePath);
    }
});

console.log('Total files modified:', modifiedFiles);
