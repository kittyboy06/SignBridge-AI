const fs = require('fs');
const path = require('path');
const readline = require('readline');
const tf = require('@tensorflow/tfjs');

const csvPath = path.join(__dirname, '..', 'data', 'isl-landmarks', 'Indian Sign Language Gesture Landmarks.csv');
const modelJsonPath = path.join(__dirname, '..', 'public', 'model', 'model.json');

async function evaluateModel() {
  console.log('Starting SignBridge AI Model Evaluation Script...');
  console.log('Loading trained model from:', modelJsonPath);

  if (!fs.existsSync(csvPath)) {
    console.error('Error: Dataset CSV file not found.');
    process.exit(1);
  }

  // 1. Load the model using custom memory loader to bypass Node fetch limitations
  const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
  const weightsBin = fs.readFileSync(path.join(path.dirname(modelJsonPath), 'group1-shard1of1.bin'));
  
  const model = await tf.loadLayersModel(tf.io.fromMemory({
    modelTopology: modelJson.modelTopology,
    weightSpecs: modelJson.weightsManifest[0].weights,
    weightData: weightsBin.buffer.slice(weightsBin.byteOffset, weightsBin.byteOffset + weightsBin.byteLength)
  }));
  console.log('Model loaded successfully.');

  // 2. Read lines and store them
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const testSamples = [];
  let rowCount = 0;

  for await (const line of rl) {
    if (rowCount === 0) {
      rowCount++;
      continue; // Skip header
    }

    const parts = line.split(',');
    if (parts.length < 128) continue;

    const labelIdx = parseInt(parts[0], 10);
    const features = [];
    for (let i = 1; i < 128; i++) {
      features.push(parseFloat(parts[i]) || -1.0);
    }

    testSamples.push({ labelIdx, features });
    rowCount++;
  }

  console.log(`Discovered ${testSamples.length} samples. Picking random subsets for test validation...`);

  // 3. Test on 10 random samples
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let correctCount = 0;
  const numTests = 10;

  console.log('\n--- EVALUATION RESULTS ---');
  for (let i = 0; i < numTests; i++) {
    const randomIdx = Math.floor(Math.random() * testSamples.length);
    const sample = testSamples[randomIdx];
    
    const inputTensor = tf.tensor2d([sample.features], [1, 127]);
    const prediction = model.predict(inputTensor);
    const classProbs = prediction.dataSync();

    let predIdx = 0;
    let maxVal = 0;
    for (let j = 0; j < classProbs.length; j++) {
      if (classProbs[j] > maxVal) {
        maxVal = classProbs[j];
        predIdx = j;
      }
    }

    const expected = alphabet[sample.labelIdx];
    const predicted = alphabet[predIdx];
    const confidence = Math.round(maxVal * 100);
    const status = expected === predicted ? '✓ MATCH' : '✗ MISMATCH';
    
    if (expected === predicted) correctCount++;

    console.log(`Sample #${i+1} [Index: ${randomIdx}]: Expected: ${expected} | Predicted: ${predicted} | Confidence: ${confidence}% | ${status}`);
    
    inputTensor.dispose();
    prediction.dispose();
  }

  console.log('--------------------------');
  console.log(`Accuracy: ${((correctCount / numTests) * 100).toFixed(1)}% (${correctCount}/${numTests} correct)\n`);
}

evaluateModel().catch(err => console.error('Error running evaluation:', err));
