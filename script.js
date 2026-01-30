const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const fileNameDisplay = document.getElementById('fileName');
const uploadForm = document.getElementById('uploadForm');
const textForm = document.getElementById('textForm'); // New form
const textInput = document.getElementById('textInput'); // New input
const resultSection = document.getElementById('resultSection');
const qrImage = document.getElementById('qrImage');
const downloadLink = document.getElementById('downloadLink');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');
const resetBtn = document.getElementById('resetBtn');

// Tab Switching Logic
const tabs = document.querySelectorAll('.tab-btn');
const imageMode = document.getElementById('imageMode');
const textMode = document.getElementById('textMode');
let currentMode = 'image';

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab UI
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show/Hide sections
        const mode = tab.dataset.tab;
        currentMode = mode;
        if (mode === 'image') {
            imageMode.style.display = 'block';
            textMode.style.display = 'none';
        } else {
            imageMode.style.display = 'none';
            textMode.style.display = 'block';
        }
    });
});


// Drag and drop effects
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('dragover');
}

function unhighlight(e) {
    dropArea.classList.remove('dragover');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
            fileNameDisplay.textContent = file.name;
        }
    }
}

function validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, PNG, GIF, WEBP).');
        fileNameDisplay.textContent = '';
        fileInput.value = ''; // Clear input
        return false;
    }
    errorMsg.classList.add('hidden');
    return true;
}

// ----- FORM SUBMISSION -----

// Image Upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
        showError('No file selected.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    await handleGeneration('/upload', formData);
});

// Text/URL Generation
textForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) {
        showError('Please enter some text or a URL.');
        return;
    }

    await handleGeneration('/generate', JSON.stringify({ text: text }), {
        'Content-Type': 'application/json'
    });
});

async function handleGeneration(url, body, headers = {}) {
    showLoading(true);
    resetUI();

    try {
        const options = {
            method: 'POST',
            body: body
        };

        if (Object.keys(headers).length > 0) {
            options.headers = headers;
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }

        displayResult(data.qrCode);

    } catch (error) {
        showError(error.message || 'An error occurred.');
    } finally {
        showLoading(false);
    }
}

function displayResult(qrCodeUrl) {
    qrImage.src = qrCodeUrl;
    downloadLink.href = qrCodeUrl;
    resultSection.classList.remove('hidden');
    document.querySelector('.input-container').style.display = 'none'; // Hide input during result
}

function showLoading(isLoading) {
    if (isLoading) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function resetUI() {
    resultSection.classList.add('hidden');
    errorMsg.classList.add('hidden');
}

resetBtn.addEventListener('click', () => {
    resetUI();
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    textInput.value = '';
    document.querySelector('.input-container').style.display = 'flex'; // Show input again
});
