const fs = require('fs');
const path = require('path');

const datasetDir = 'd:/Projects/Hackathon/SignBridge AI/data/dataset - Gesture Speech';
const outputPath = path.join(__dirname, '..', 'public', 'image_list.json');

const alphabet = 'abcdefghijklmnopqrstuvwxyz{';
const labelMap = {};
for (let i = 0; i < alphabet.length; i++) {
  labelMap[alphabet[i]] = i;
}

function generateList() {
  console.log('Generating image list for browser landmark extraction...');
  const imageList = [];

  for (const char of alphabet) {
    const folderPath = path.join(datasetDir, char);
    if (!fs.existsSync(folderPath)) {
      console.log(`Warning: folder not found ${folderPath}`);
      continue;
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'));

    console.log(`Class '${char}' (label ${labelMap[char]}): Found ${files.length} images.`);
    // Take max 400 images to keep extraction fast and balanced
    const selected = files.slice(0, 400);

    for (const file of selected) {
      // Normalize path to use forward slashes
      const absolutePath = path.join(folderPath, file).replace(/\\/g, '/');
      imageList.push({
        char,
        label: labelMap[char],
        path: absolutePath
      });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(imageList, null, 2));
  console.log(`Successfully wrote ${imageList.length} image entries to ${outputPath}`);
}

generateList();
