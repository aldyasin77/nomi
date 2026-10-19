import fs from 'fs'
import path from 'path'

const dir = 'public/logos'

if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir)
  let count = 0

  for (const file of files) {
    const fullPath = path.join(dir, file)
    let content = fs.readFileSync(fullPath, 'utf8')
    if (content.startsWith('<svg') && !content.includes('xmlns=')) {
      content = content.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
      fs.writeFileSync(fullPath, content, 'utf8')
      count++
    }
  }

  console.log(`Successfully added xmlns to ${count} SVG files in ${dir}`)
}
