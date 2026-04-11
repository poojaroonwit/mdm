import * as fs from 'fs'
import * as path from 'path'

const TARGET_DIR = path.resolve('src')
const OLD_BLUES = ['#1e40af', '#1e40af', '#1e40af', '#1e40af']
const NEW_BLUE = '#1e40af'

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const filePath = path.join(dir, f)
    const isDirectory = fs.statSync(filePath).isDirectory()
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== 'dist') {
        walkDir(filePath, callback)
      }
    } else {
      callback(filePath)
    }
  })
}

console.log(`Starting bulk replacement of primary blue in ${TARGET_DIR}...`)

let filesModified = 0
let occurrencesReplaced = 0

walkDir(TARGET_DIR, (filePath) => {
  if (!['.ts', '.tsx', '.css', '.scss', '.json'].some(ext => filePath.endsWith(ext))) {
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  OLD_BLUES.forEach(blue => {
    const regex = new RegExp(blue, 'g')
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, NEW_BLUE)
      occurrencesReplaced += matches.length
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    filesModified++
    // Use relative path for logging
    console.log(`Updated: ${path.relative(process.cwd(), filePath)}`)
  }
})

console.log('\nBulk Replacement Complete!')
console.log(`Files modified: ${filesModified}`)
console.log(`Occurrences replaced: ${occurrencesReplaced}`)
