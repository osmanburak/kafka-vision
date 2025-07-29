const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  '../server.js',
  '../auth/ldapConfig.js',
  './encryption.js'
];

// Read and replace console.log statements
filesToProcess.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Replace console.log with logger.debug
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, 'logger.debug(');
    modified = true;
  }
  
  // Replace console.error with logger.error (keeping console.error as well)
  // Don't replace, just note where they are for manual review
  
  if (modified) {
    // Check if logger is already imported
    if (!content.includes("require('./utils/logger')") && !content.includes('require(\'./logger\')') && !content.includes('require(\'../utils/logger\')')) {
      // Add logger import at the top after other requires
      const requireMatch = content.match(/const .* = require\(.*\);/);
      if (requireMatch) {
        const lastRequireIndex = content.lastIndexOf(requireMatch[0]) + requireMatch[0].length;
        const importStatement = filePath.includes('auth/') 
          ? "\nconst logger = require('../utils/logger');"
          : filePath.includes('utils/') 
            ? "\nconst logger = require('./logger');"
            : "\nconst logger = require('./utils/logger');";
        
        // Only add if not already present
        if (!content.includes(importStatement.trim())) {
          content = content.slice(0, lastRequireIndex) + importStatement + content.slice(lastRequireIndex);
        }
      }
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});

console.log('Console.log replacement complete!');