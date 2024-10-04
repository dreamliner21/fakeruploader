const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const archiver = require('archiver');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Set folder static untuk file CSS dan JS di dalam folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup untuk menyimpan file yang di-upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Menyimpan file di folder 'uploads'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Menambahkan timestamp ke nama file
  }
});

const upload = multer({ storage: storage });

// Membaca file key.json untuk validasi key
let validKeys = [];
fs.readFile(path.join(__dirname, 'key.json'), 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading key.json:', err);
    return;
  }
  validKeys = JSON.parse(data).keys;
});

// Variabel untuk menyimpan timestamp terakhir file yang di-upload
let lastUploadTimestamp = 0;

// Fungsi untuk mengompres file yang diunggah menjadi ZIP setiap 30 menit
const compressFiles = () => {
  const jsonFilePath = 'fileData.json';

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file data for compression:', err);
      return;
    }

    const files = JSON.parse(data);

    // Ambil timestamp dari file terakhir
    const newTimestamp = files.length > 0 ? Math.max(...files.map(file => new Date(file.timestamp).getTime())) : 0;

    // Periksa apakah ada file baru
    if (newTimestamp > lastUploadTimestamp) {
      lastUploadTimestamp = newTimestamp; // Update timestamp terakhir
      
      // Kompres file
      const zipFileName = `dataupload_${Date.now()}.zip`;
      const output = fs.createWriteStream(zipFileName);
      const archive = archiver('zip');

      output.on('close', () => {
        console.log(`Files compressed into: ${zipFileName}`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Tambahkan semua file dari direktori uploads ke dalam zip
      files.forEach(file => {
        archive.file(path.join(__dirname, 'uploads', file.filename), { name: file.originalname });
      });

      archive.finalize();
    } else {
      console.log('No new files to compress.');
    }
  });
};

// Set interval untuk memeriksa dan mengompres file setiap 30 menit
setInterval(compressFiles, 30 * 60 * 1000); // 30 menit dalam milidetik

// Halaman Upload
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); // Mengirim file HTML
});

// Meng-handle file yang di-upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.send('Please upload a file');
  }

  // Ambil nama file dan type
  const fileData = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    timestamp: new Date().toISOString()
  };

  // Baca file JSON yang ada
  const jsonFilePath = 'fileData.json';
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    let jsonArray = [];
    if (!err) {
      jsonArray = JSON.parse(data);
    }

    // Tambahkan data file baru
    jsonArray.push(fileData);

    // Simpan kembali ke file JSON
    fs.writeFile(jsonFilePath, JSON.stringify(jsonArray, null, 2), (err) => {
      if (err) {
        console.error('Error writing to JSON file', err);
      }
    });
  });

  // Redirect ke halaman uploads
  res.redirect('/uploads');
});

// Halaman untuk menampilkan pesan bahwa file telah di-upload
app.get('/uploads', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'uploads.html')); // Mengirim file HTML
});

// Route untuk memvalidasi key dan mengarahkan ke file-list
app.post('/validate-key', (req, res) => {
  const { key } = req.body;

  // Periksa apakah key yang dimasukkan ada dalam validKeys
  if (validKeys.includes(key)) {
    res.redirect('/file-list');
  } else {
    res.sendFile(path.join(__dirname, 'views', 'key-error.html')); // Mengirim file HTML error
  }
});

// Halaman file-list untuk melihat semua file yang telah di-upload
app.get('/file-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'file-list.html')); // Mengirim file HTML
});

// Endpoint untuk mengirim data file ke file-list.html
app.get('/file-list-data', (req, res) => {
  const jsonFilePath = 'fileData.json';
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file data');
    }
    const files = JSON.parse(data);
    res.json(files); // Mengirim data files dalam format JSON
  });
});

// Port untuk menjalankan server
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
