const axios = require('axios');
const fs = require('fs');

async function downloadFile(url, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`${outputPath} already exists. Skipping download.`);
    return;
  }

  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  const totalLength = response.headers['content-length'];

  console.log(`Starting download of ${outputPath}...`);
  let downloadedLength = 0;
  response.data.on('data', (chunk) => {
    downloadedLength += chunk.length;
    process.stdout.write(`Downloaded ${(downloadedLength / totalLength * 100).toFixed(2)}% (${downloadedLength} of ${totalLength} bytes)\r`);
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`\nDownload of ${outputPath} completed.`);
      resolve();
    });
    writer.on('error', reject);
  });
}

async function setupModel(path) {
  try {
    console.log('Downloading llamafile.exe...');
    await downloadFile('https://github.com/Mozilla-Ocho/llamafile/releases/download/0.6/llamafile-0.6', path + '/llamafile.exe');

    console.log('Downloading llava-phi-3-mini-int4.gguf...');
    await downloadFile('https://huggingface.co/xtuner/llava-phi-3-mini-gguf/resolve/main/llava-phi-3-mini-int4.gguf?download=true', path + '/llava-phi-3-mini-int4.gguf');

    console.log('Downloading llava-phi-3-mini-mmproj-f16.gguf...');
    await downloadFile('https://huggingface.co/xtuner/llava-phi-3-mini-gguf/resolve/main/llava-phi-3-mini-mmproj-f16.gguf?download=true', path + '/llava-phi-3-mini-mmproj-f16.gguf');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Retrieve the download path from command line arguments
const downloadPath = process.argv[2];

if (!downloadPath) {
  console.error('Please provide a download path as an argument.');
  process.exit(1);
}

// Start the setup process
setupModel(downloadPath);

