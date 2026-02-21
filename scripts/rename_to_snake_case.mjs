import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function toSnakeCase(str) {
  return str
    .replace(/\.tsx?$/, '') // remove extension for now
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(SRC_DIR);
const renameMap = new Map();

// 1. Rename files
for (const filePath of allFiles) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  
  if (baseName === 'index' || baseName === 'main' || baseName === 'App' || baseName === 'vite-env.d') continue; // keep entry points mostly intact, though we can lowercase app
  
  const snakedName = toSnakeCase(baseName);
  
  if (snakedName !== baseName && snakedName !== baseName.toLowerCase()) { // if truly changing
    const newPath = path.join(dir, `${snakedName}${ext}`);
    if (filePath !== newPath) {
      fs.renameSync(filePath, newPath);
      renameMap.set(baseName, snakedName);
      console.log(`Renamed: ${baseName} -> ${snakedName}`);
    }
  }
}

// Also rename App.tsx to app.tsx since the user requested ALL files
const defaultAppPath = path.join(SRC_DIR, 'App.tsx');
if (fs.existsSync(defaultAppPath)) {
  fs.renameSync(defaultAppPath, path.join(SRC_DIR, 'app.tsx'));
  renameMap.set('App', 'app');
  console.log(`Renamed: App -> app`);
}

// 2. Update imports in all files
const updatedFiles = getAllFiles(SRC_DIR);
for (const filePath of updatedFiles) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let contentChanged = false;
  
  for (const [oldName, newName] of renameMap.entries()) {
    // We are looking for something like: import { X } from "@/folder/OldName";
    // or import OldName from "./OldName";
    // We only want to replace the LAST part of the path (the filename)
    // Regex matches: from "something/OldName" or from "./OldName" or from "@/OldName"
    const regex = new RegExp(`(from\\s+['"][^'"]*\\/)${oldName}(['"])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${newName}$2`);
      contentChanged = true;
    }
    
    // Also match relative imports like from "../OldName"
    const regex2 = new RegExp(`(from\\s+['"]\\.\\.?\\/)${oldName}(['"])`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `$1${newName}$2`);
      contentChanged = true;
    }
  }

  if (contentChanged) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated imports in: ${path.basename(filePath)}`);
  }
}

// 3. Update main.tsx import for App
const mainTsxPath = path.join(SRC_DIR, 'main.tsx');
if (fs.existsSync(mainTsxPath)) {
  let mainContent = fs.readFileSync(mainTsxPath, 'utf8');
  mainContent = mainContent.replace(/from ['"]\.\/App['"]/g, `from "./app"`);
  fs.writeFileSync(mainTsxPath, mainContent, 'utf8');
}
