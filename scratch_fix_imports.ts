import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules') walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = [...walk('api'), ...walk('server')];
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Regex to match from "./something" or from "../something" or import "./something"
  // and append .js if it doesn't already end in .js
  content = content.replace(/(import\s+.*?from\s+["']\.\.?\/[^"']*)(["'])/g, (match, p1, p2) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
      return p1 + '.js' + p2;
    }
    return match;
  });

  // Also replace dynamic imports if any
  content = content.replace(/(import\(["']\.\.?\/[^"']*)(["']\))/g, (match, p1, p2) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
      return p1 + '.js' + p2;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
  }
}

console.log(`Added .js extensions to ${changedFiles} files.`);
