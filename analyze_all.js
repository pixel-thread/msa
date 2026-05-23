const fs = require('fs');
const { execSync } = require('child_process');
const diff = execSync('git diff HEAD').toString();
const files = diff.split('diff --git ');
for (let i = 1; i < files.length; i++) {
  const fileDiff = files[i];
  const lines = fileDiff.split('\n');
  const filename = lines[0].split(' b/')[1];
  let hasCodeChange = false;
  for (const line of lines) {
    if ((line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---'))) {
      const trimmed = line.substring(1).trim();
      if (!trimmed.startsWith('import ') && !trimmed.startsWith('export ') && !trimmed.startsWith('//') && trimmed !== '' && !trimmed.startsWith('}') && !trimmed.startsWith(']')) {
        hasCodeChange = true;
      }
    }
  }
  if (hasCodeChange) {
    console.log(filename);
  }
}
