const fs = require('fs');
const diff = fs.readFileSync('diff.txt', 'utf8');
const files = diff.split('diff --git ');
for (let i = 1; i < files.length; i++) {
  const fileDiff = files[i];
  const lines = fileDiff.split('\n');
  const filename = lines[0].split(' b/')[1];
  let hasCodeChange = false;
  for (const line of lines) {
    if ((line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---'))) {
      if (!line.substring(1).trim().startsWith('import') && !line.substring(1).trim().startsWith('//') && line.substring(1).trim() !== '') {
        // console.log(`Code change in ${filename}: ${line}`);
        hasCodeChange = true;
      }
    }
  }
  if (hasCodeChange) {
    console.log(filename);
  }
}
