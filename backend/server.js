// Import required modules
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exiftool } = require('exiftool-vendored');

// Create an instance of Express
const app = express();

// Configure multer for file upload
// This allows files up to 50MB
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// Enable CORS
app.use(cors());

// Ensure directories exist
['uploads', 'scrubbed'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// POST /api/scrub : upload and scrub the file
app.post('/api/scrub', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const inputPath = req.file.path;
  const outputPath = path.join('scrubbed', req.file.originalname);

  try {
    // Remove all metadata
    await exiftool.write(inputPath, {}, ['-all=']);
    fs.renameSync(inputPath, outputPath);

    // Send the scrubbed file for download and clean up
    res.download(outputPath, req.file.originalname, () => {
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrub file.' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('MetaScrub Scrubber backend is running!');
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MetaScrub Scrubber backend is running on port ${PORT}`);
});