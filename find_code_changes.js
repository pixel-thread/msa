const fs = require('fs');
const { execSync } = require('child_process');
const diff = execSync('git diff HEAD').toString();
const files = diff.split('diff --git ');
for (let i = 1; i < files.length; i++) {
  const fileDiff = files[i];
  const lines = fileDiff.split('\n');
  const filename = lines[0].split(' b/')[1];
  let hasCodeChange = false;
  let hasImportChange = false;
  let codeChanges = [];
  for (const line of lines) {
    if ((line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---'))) {
      const trimmed = line.substring(1).trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export * from')) {
        hasImportChange = true;
      } else if (trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        // Exclude lines that are just closing braces or brackets, or reformatting commas
        if (!/^[}\]\),;]+$/.test(trimmed)) {
          hasCodeChange = true;
          codeChanges.push(line);
        }
      }
    }
  }
  if (hasCodeChange) {
    console.log(`\n--- ${filename} ---`);
    console.log(`Import changed: ${hasImportChange}`);
    console.log(codeChanges.join('\n'));
  }
}
