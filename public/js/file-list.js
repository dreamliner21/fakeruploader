document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('keyInput');
    const showAllBtn = document.getElementById('showAllBtn');
    const fileList = document.getElementById('fileList');
    const originalList = Array.from(fileList.children);
  
    // Fungsi untuk memfilter daftar file berdasarkan key input
    const filterFiles = () => {
      const key = keyInput.value.toLowerCase();
      fileList.innerHTML = ''; // Kosongkan daftar file
  
      originalList.forEach(fileItem => {
        const fileName = fileItem.querySelector('a').textContent.toLowerCase();
        if (fileName.includes(key)) {
          fileList.appendChild(fileItem); // Tampilkan file jika cocok
        }
      });
    };
  
    // Event listener untuk filter berdasarkan key input
    keyInput.addEventListener('input', filterFiles);
  
    // Tombol untuk menampilkan semua file kembali
    showAllBtn.addEventListener('click', () => {
      fileList.innerHTML = ''; // Kosongkan daftar file
      originalList.forEach(fileItem => {
        fileList.appendChild(fileItem); // Tampilkan semua file
      });
      keyInput.value = ''; // Reset input
    });
  });
  