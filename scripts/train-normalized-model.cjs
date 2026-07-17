const fs = require('fs');
const readline = require('readline');
const path = require('path');
const tf = require('@tensorflow/tfjs');

const csvPath = path.join(__dirname, '..', 'data', 'isl-landmarks', 'Normalized_Gesture_Landmarks.csv');
const modelDir = path.join(__dirname, '..', 'public', 'model');

async function trainModel() {
  console.log('Starting SignBridge AI Normalized Classifier Training Pipeline...');
  console.log('Reading dataset from:', csvPath);

  if (!fs.existsSync(csvPath)) {
    console.error('Error: Dataset CSV file not found at:', csvPath);
    process.exit(1);
  }

  const X_data = [];
  const y_data = [];
  let rowCount = 0;

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (rowCount === 0) {
      rowCount++;
      continue; // Skip header
    }

    const parts = line.split(',');
    if (parts.length < 128) continue; // Skip malformed rows

    // Label (column 0) - class 0 to 26 (A-Z + Space)
    const labelIdx = parseInt(parts[0], 10);
    if (isNaN(labelIdx) || labelIdx < 0 || labelIdx > 26) continue;

    // Features (column 1 to 127)
    const features = [];
    for (let i = 1; i < 128; i++) {
      const val = parseFloat(parts[i]);
      features.push(isNaN(val) ? -1.0 : val);
    }

    X_data.push(features);
    
    // One-hot encode label for 27 classes
    const oneHot = new Array(27).fill(0);
    oneHot[labelIdx] = 1;
    y_data.push(oneHot);

    rowCount++;
  }

  console.log(`Finished loading dataset. Total rows parsed: ${X_data.length}`);
  
  if (X_data.length === 0) {
    console.error('Error: No training data loaded.');
    process.exit(1);
  }

  // Shuffle dataset
  console.log('Shuffling dataset to mix classes...');
  for (let i = X_data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempX = X_data[i];
    X_data[i] = X_data[j];
    X_data[j] = tempX;

    const tempy = y_data[i];
    y_data[i] = y_data[j];
    y_data[j] = tempy;
  }

  // Convert to Tensors
  console.log('Converting data to tensors...');
  const xs = tf.tensor2d(X_data, [X_data.length, 127]);
  const ys = tf.tensor2d(y_data, [y_data.length, 27]);

  // Define 27-class Model Architecture
  console.log('Building Multilayer Perceptron (MLP) model...');
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    inputShape: [127],
    units: 128,
    activation: 'relu',
    kernelInitializer: 'glorotNormal'
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelInitializer: 'glorotNormal'
  }));

  // Output layer: 27 units for A-Z + Space soft-max classification
  model.add(tf.layers.dense({
    units: 27,
    activation: 'softmax',
    kernelInitializer: 'glorotNormal'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  model.summary();

  // Train the Model
  console.log('Training model for 30 epochs...');
  await model.fit(xs, ys, {
    epochs: 30,
    batchSize: 64,
    validationSplit: 0.15,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`
        );
      }
    }
  });

  console.log('Training complete! Saving model artifacts...');

  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    const modelJson = {
      format: 'layers-model',
      generatedBy: 'TensorFlow.js tfjs-core v' + tf.version.tfjs,
      convertedBy: null,
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{
        paths: ['./group1-shard1of1.bin'],
        weights: artifacts.weightSpecs
      }]
    };

    fs.writeFileSync(
      path.join(modelDir, 'model.json'),
      JSON.stringify(modelJson, null, 2)
    );

    const weightsBuffer = Buffer.from(artifacts.weightData);
    fs.writeFileSync(
      path.join(modelDir, 'group1-shard1of1.bin'),
      weightsBuffer
    );

    console.log('Model saved successfully to:', modelDir);
    return { modelArtifactsInfo: { dateSaved: new Date().toString() } };
  }));

  xs.dispose();
  ys.dispose();
  console.log('Normalized training pipeline successfully finished.');
}

trainModel().catch(err => {
  console.error('Error running training pipeline:', err);
});
