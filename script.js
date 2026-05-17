// DOM Elements
const csvInput = document.getElementById('csv-input');
const csvDropZone = document.getElementById('csv-drop-zone');
const imageDropZone = document.getElementById('image-drop-zone');
const loadedImagesList = document.getElementById('loaded-images-list');
const btnGenerate = document.getElementById('btn-generate');
const btnDownload = document.getElementById('btn-download');
const canvas = document.getElementById('result-canvas');
const ctx = canvas.getContext('2d');
const loadingOverlay = document.getElementById('loading-overlay');

// Settings Elements
const setMarginX = document.getElementById('setting-margin-x');
const setMarginTop = document.getElementById('setting-margin-top');
const setMarginBottom = document.getElementById('setting-margin-bottom');
const setUnit = document.getElementById('setting-unit');
const setDrawBg = document.getElementById('setting-draw-bg');
const setDrawHeight = document.getElementById('setting-draw-height');

const translations = {
    en: {
        'csv-label': 'CSV Data',
        'csv-placeholder': 'Paste CSV data here\nor drag & drop a .csv file...\n\nExample:\ncharacter.png, 160, 50, 1800, 200, 300\nanother.png, 175, 40, 1850, 210, 310',
        'csv-drop': 'Drop CSV Here',
        'images-label': 'Image Files (PNG)',
        'images-drop': 'Drag & Drop PNG images here',
        'settings-title': 'Settings',
        'margin-x': 'Character Spacing (px)',
        'margin-top': 'Top Margin (px)',
        'margin-bottom': 'Bottom Margin (px)',
        'unit-label': 'Display Unit',
        'draw-bg': 'Show Background Height Grid',
        'draw-height': 'Show Height Labels',
        'btn-generate': 'Generate Chart',
        'btn-download': 'Download PNG',
        'loading-overlay': 'Loading Images & Generating...',
        'alert-valid-csv': 'Please drop a valid .csv file.',
        'alert-no-img': 'No images loaded',
        'alert-no-csv': 'Please provide CSV data.',
        'alert-invalid-csv': 'CSV data is empty or invalid.',
        'alert-fail-img': 'No images were successfully loaded.',
        'alert-error': 'An error occurred during generation: ',
        'warn-invalid-y': 'Invalid TopY/BottomY for {0}',
        'warn-invalid-x': 'Invalid FaceX for {0}',
        'warn-not-found': 'Image not loaded: {0}',
        'warn-failed-load': 'Failed to load image: {0}',
        'error-csv-columns': 'CSV Line {0}: Expected 6 columns.',
        'error-csv-types': 'CSV Line {0}: Numeric values are missing or invalid.'
    },
    ja: {
        'csv-label': 'CSV データ',
        'csv-placeholder': 'ここにCSVデータを貼り付けるか、\n.csvファイルをドラッグ＆ドロップ...\n\n【入力例】\ncharacter.png, 160, 50, 1800, 200, 300\nanother.png, 175, 40, 1850, 210, 310',
        'csv-drop': 'ここにCSVをドロップ',
        'images-label': '画像ファイル (PNG)',
        'images-drop': 'ここに画像ファイルをドラッグ＆ドロップ',
        'settings-title': '設定',
        'margin-x': '人物間の余白 (px)',
        'margin-top': '上の余白 (px)',
        'margin-bottom': '下の余白 (px)',
        'unit-label': '表示単位',
        'draw-bg': '背景の身長グリッドを描画',
        'draw-height': '頭上の身長テキストを描画',
        'btn-generate': 'チャートを生成',
        'btn-download': 'PNGをダウンロード',
        'loading-overlay': '画像を読み込み、生成中...',
        'alert-valid-csv': '有効な.csvファイルをドロップしてください。',
        'alert-no-img': '読み込まれた画像はありません',
        'alert-no-csv': 'CSVデータを入力してください。',
        'alert-invalid-csv': 'CSVデータが空か無効です。',
        'alert-fail-img': '画像の読み込みに失敗しました。',
        'alert-error': '生成中にエラーが発生しました: ',
        'warn-invalid-y': '{0} の TopY/BottomY が無効です',
        'warn-invalid-x': '{0} の FaceX が無効です',
        'warn-not-found': '画像が読み込まれていません: {0}',
        'warn-failed-load': '画像の読み込みに失敗しました: {0}',
        'error-csv-columns': 'CSVの {0} 行目: 列数が足りません（6列必要です）。',
        'error-csv-types': 'CSVの {0} 行目: 数値が正しく入力されていません。'
    }
};

let currentLang = (navigator.language || navigator.userLanguage || '').startsWith('ja') ? 'ja' : 'en';

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-ja').classList.toggle('active', lang === 'ja');

    updateLoadedImagesUI();
}

function t(key, ...args) {
    let str = translations[currentLang][key] || key;
    args.forEach((arg, i) => {
        str = str.replace(`{${i}}`, arg);
    });
    return str;
}

function showToast(msg, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fadeOut');
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        });
    }, 5000);
}

// State
let localImages = {}; // key: filename, value: object URL
let currentZoom = 1;

function applyZoom() {
    if (!canvas.width) return;
    canvas.style.width = `${canvas.width * currentZoom}px`;
    canvas.style.height = `${canvas.height * currentZoom}px`;
}

// Initialize
function init() {
    setLanguage(currentLang);
    setupDragAndDrop();
    setupCanvasDrag();
    btnGenerate.addEventListener('click', generateChart);
    btnDownload.addEventListener('click', downloadCanvas);
}

// Canvas Drag and Scroll Setup
function setupCanvasDrag() {
    const container = document.querySelector('.canvas-container');
    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    container.style.cursor = 'grab';

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });

    container.addEventListener('wheel', (e) => {
        if (!canvas.width) return;

        // Prevent default browser scrolling
        e.preventDefault();

        const zoomFactor = 1.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        let newZoom = currentZoom * (direction === 1 ? zoomFactor : (1 / zoomFactor));

        if (newZoom < 0.05) newZoom = 0.05;
        if (newZoom > 10.0) newZoom = 10.0;

        // Keep mouse position stable (roughly)
        const mouseX = e.pageX - container.offsetLeft;
        const mouseY = e.pageY - container.offsetTop;

        const scrollRatioX = (container.scrollLeft + mouseX) / (canvas.width * currentZoom);
        const scrollRatioY = (container.scrollTop + mouseY) / (canvas.height * currentZoom);

        currentZoom = newZoom;
        applyZoom();

        container.scrollLeft = (canvas.width * currentZoom * scrollRatioX) - mouseX;
        container.scrollTop = (canvas.height * currentZoom * scrollRatioY) - mouseY;
    }, { passive: false });
}

// Drag & Drop Setup
function setupDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // CSV Drop Zone
    ['dragenter', 'dragover'].forEach(eventName => {
        csvDropZone.addEventListener(eventName, () => csvDropZone.classList.add('drag-over'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        csvDropZone.addEventListener(eventName, () => csvDropZone.classList.remove('drag-over'), false);
    });

    csvDropZone.addEventListener('drop', handleCsvDrop, false);

    // Image Drop Zone
    ['dragenter', 'dragover'].forEach(eventName => {
        imageDropZone.addEventListener(eventName, () => imageDropZone.classList.add('drag-over'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        imageDropZone.addEventListener(eventName, () => imageDropZone.classList.remove('drag-over'), false);
    });

    imageDropZone.addEventListener('drop', handleImageDrop, false);
}

function handleCsvDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = function (e) {
                csvInput.value = e.target.result;
            };
            reader.readAsText(file);
        } else {
            showToast(t('alert-valid-csv'), 'error');
        }
    }
}

function handleImageDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            // Create object URL and store in map
            if (localImages[file.name]) {
                URL.revokeObjectURL(localImages[file.name]);
            }
            localImages[file.name] = URL.createObjectURL(file);
            updateLoadedImagesUI();
        }
    }
}

function updateLoadedImagesUI() {
    loadedImagesList.innerHTML = '';
    const keys = Object.keys(localImages);
    if (keys.length === 0) return;

    keys.forEach(key => {
        const li = document.createElement('li');
        li.textContent = key;
        li.title = key;
        loadedImagesList.appendChild(li);
    });
}

// CSV Parser
function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = ['Filename', 'Height', 'TopY', 'BottomY', 'LeftX', 'RightX'];
    const data = [];

    for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].trim();
        if (!lineText) continue;

        // Skip header if user accidentally included it
        if (lineText.toLowerCase().includes('filename') || lineText.toLowerCase().includes('height')) continue;

        const values = lineText.split(',').map(v => v.trim());

        if (values.length < 6) {
            throw new Error(t('error-csv-columns', i + 1));
        }

        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] || '';
        }

        // Validate types
        let hVal = row.Height;
        let parsedHeight = NaN;
        if (typeof hVal === 'string' && (hVal.includes("'") || hVal.includes("’"))) {
            const parts = hVal.split(/['’]/);
            const ft = parseFloat(parts[0]);
            const inchStr = parts[1] ? parts[1].replace(/["”]/g, '').trim() : '0';
            const inch = parseFloat(inchStr) || 0;
            parsedHeight = (ft * 12 + inch) * 2.54;
            row.Height = parsedHeight;
        } else {
            parsedHeight = parseFloat(hVal);
            row.Height = parsedHeight;
        }

        if (isNaN(parsedHeight) ||
            isNaN(parseInt(row.TopY, 10)) ||
            isNaN(parseInt(row.BottomY, 10)) ||
            isNaN(parseInt(row.LeftX, 10)) ||
            isNaN(parseInt(row.RightX, 10))) {
            throw new Error(t('error-csv-types', i + 1));
        }

        data.push(row);
    }
    return data;
}

// Load an image as a Promise
function loadImage(src, rowData) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ img, meta: rowData });
        img.onerror = () => {
            showToast(t('warn-failed-load', src), 'error');
            // Resolve with null instead of reject to allow other images to load
            resolve({ img: null, meta: rowData, error: `Failed to load: ${src}` });
        };
        img.src = src;
    });
}

// Main Generation Logic
async function generateChart() {
    const csvData = csvInput.value.trim();
    if (!csvData) {
        showToast(t('alert-no-csv'), 'error');
        return;
    }

    let meta;
    try {
        meta = parseCSV(csvData);
    } catch (e) {
        showToast(e.message, 'error');
        return;
    }

    if (meta.length === 0) {
        showToast(t('alert-invalid-csv'), 'error');
        return;
    }

    loadingOverlay.classList.remove('hidden');
    btnDownload.disabled = true;

    try {
        const marginX = parseInt(setMarginX.value, 10);
        const marginTop = parseInt(setMarginTop.value, 10);
        const marginBottom = parseInt(setMarginBottom.value, 10);
        const unit = setUnit.value;
        const drawBg = setDrawBg.checked;
        const drawHeight = setDrawHeight.checked;

        // Load all images
        const imagePromises = meta.map((m, index) => {
            m._csvIndex = index; // Preserve CSV order
            m.TopY = parseInt(m.TopY, 10);
            m.BottomY = parseInt(m.BottomY, 10);
            m.Height = parseFloat(m.Height);
            m.LeftX = parseInt(m.LeftX, 10);
            m.RightX = parseInt(m.RightX, 10);

            // Validate
            if (m.BottomY <= m.TopY) showToast(t('warn-invalid-y', m.Filename), 'warn');
            if (m.Height <= 0) showToast(t('warn-invalid-h', m.Filename), 'warn');
            if (m.RightX <= m.LeftX) showToast(t('warn-invalid-x', m.Filename), 'warn');

            // Check if image is loaded locally
            let src = localImages[m.Filename];
            if (!src) {
                showToast(t('warn-not-found', m.Filename), 'error');
                return Promise.resolve({ img: null, meta: m, error: `Image not found: ${m.Filename}` });
            }

            return loadImage(src, m);
        });

        const loadedResults = await Promise.all(imagePromises);

        // Filter out failed images
        let imgs = loadedResults.filter(r => r.img !== null).map(r => {
            const bodyPx = r.meta.BottomY - r.meta.TopY;
            return {
                meta: r.meta,
                img: r.img,
                srcWidthPx: r.img.width,
                srcHeightPx: r.img.height,
                bodyPx: bodyPx,
                csvIndex: r.meta._csvIndex
            };
        });

        if (imgs.length === 0) {
            showToast(t('alert-fail-img'), 'error');
            loadingOverlay.classList.add('hidden');
            return;
        }

        // Calculate Scale - auto adapt to tallest person's resolution
        const tallestPerson = imgs.reduce((prev, current) => (prev.meta.Height > current.meta.Height) ? prev : current);
        const maxDisplayPx = tallestPerson.bodyPx;
        const maxHeight = tallestPerson.meta.Height;
        const pxPerCm = maxDisplayPx / maxHeight;

        imgs.forEach(i => {
            i.scale = (pxPerCm * i.meta.Height) / i.bodyPx;
            i.dstWidth = Math.round(i.srcWidthPx * i.scale);
            i.dstHeight = Math.round(i.srcHeightPx * i.scale);
        });

        // X Coordinate Calculation
        let currentX = 0;
        imgs.forEach(i => {
            const faceWidthRaw = (i.meta.RightX - i.meta.LeftX) * i.scale;
            i.faceWidth = Math.ceil(faceWidthRaw);
            i.drawX = currentX - (i.meta.LeftX * i.scale);
            currentX += i.faceWidth + marginX;
        });

        // Auto-correct left edge clipping
        const minDrawX = Math.min(...imgs.map(i => i.drawX));
        const shiftX = marginX - minDrawX;
        imgs.forEach(i => {
            i.drawX += shiftX;
        });

        // Auto-calculate Baseline (Top edge clipping)
        let requiredBaseline = 0;
        imgs.forEach(i => {
            const scaledBottomY = Math.round(i.meta.BottomY * i.scale);
            const scaledTopY = Math.round(i.meta.TopY * i.scale);
            // Image top is at -scaledBottomY (relative to baseline)
            // Text top is roughly at -scaledBottomY + scaledTopY - 30 (relative to baseline)
            const topmostRel = -scaledBottomY + Math.min(0, scaledTopY - 30);
            requiredBaseline = Math.max(requiredBaseline, marginTop - topmostRel);
        });
        const baseline = Math.ceil(requiredBaseline);

        // Canvas Height (baseline is the 0cm ground line)
        const canvasHeight = baseline + marginBottom;

        // Canvas Size
        const totalWidth = Math.ceil(Math.max(...imgs.map(i => i.drawX + i.dstWidth)) + marginX);

        canvas.width = totalWidth;
        canvas.height = canvasHeight;

        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Background Grid
        if (drawBg) {
            // Fill background white when grid is enabled
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = "16px Arial";
            ctx.textBaseline = "middle";

            if (unit === 'ftin') {
                let inches = 0;
                while (true) {
                    const y = baseline - Math.round(inches * 2.54 * pxPerCm);
                    if (y < 0) break;

                    if (inches % 12 === 0) {
                        ctx.strokeStyle = '#A9A9A9'; // DarkGray
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(totalWidth, y);
                        ctx.stroke();

                        const ft = inches / 12;
                        const str = `${ft}'0"`;
                        ctx.fillStyle = '#696969'; // DimGray

                        // Left text
                        ctx.textAlign = "left";
                        ctx.fillText(str, 10, y - 10);

                        // Right text
                        ctx.textAlign = "right";
                        ctx.fillText(str, totalWidth - 10, y - 10);
                    } else if (inches % 6 === 0) {
                        ctx.strokeStyle = '#D3D3D3'; // LightGray
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(totalWidth, y);
                        ctx.stroke();
                        ctx.setLineDash([]); // Reset
                    }
                    inches += 6;
                }
            } else {
                let cm = 0;
                while (true) {
                    const y = baseline - Math.round(cm * pxPerCm);
                    if (y < 0) break;

                    if (cm % 10 === 0) {
                        ctx.strokeStyle = '#A9A9A9'; // DarkGray
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(totalWidth, y);
                        ctx.stroke();

                        const str = `${cm} cm`;
                        ctx.fillStyle = '#696969'; // DimGray

                        // Left text
                        ctx.textAlign = "left";
                        ctx.fillText(str, 10, y - 10);

                        // Right text
                        ctx.textAlign = "right";
                        ctx.fillText(str, totalWidth - 10, y - 10);
                    } else {
                        ctx.strokeStyle = '#D3D3D3'; // LightGray
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(totalWidth, y);
                        ctx.stroke();
                        ctx.setLineDash([]); // Reset
                    }
                    cm += 5;
                }
            }
        }

        // Draw Images (Tallest in back)
        const drawOrder = [...imgs].sort((a, b) => b.meta.Height - a.meta.Height);

        if (drawHeight) {
            ctx.font = "bold 18px system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
        }

        drawOrder.forEach(i => {
            const scaledBottomY = Math.round(i.meta.BottomY * i.scale);
            const y = baseline - scaledBottomY;

            // Draw Image
            ctx.drawImage(i.img, i.drawX, y, i.dstWidth, i.dstHeight);

            if (drawHeight) {
                // Draw TopY Line
                const topYCoord = y + (i.meta.TopY * i.scale);
                ctx.strokeStyle = '#FF3366'; // Highlight color
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();

                const leftX = i.drawX + (i.meta.LeftX * i.scale);
                const rightX = i.drawX + (i.meta.RightX * i.scale);

                ctx.moveTo(leftX, topYCoord);
                ctx.lineTo(rightX, topYCoord);
                ctx.stroke();
                ctx.setLineDash([]); // Reset

                // Draw Height Value text
                let textStr;
                if (unit === 'ftin') {
                    const totalInches = i.meta.Height / 2.54;
                    const ft = Math.floor(totalInches / 12);
                    let inch = Math.round(totalInches % 12);
                    if (inch === 12) {
                        textStr = `${ft + 1}'0"`;
                    } else {
                        textStr = `${ft}'${inch}"`;
                    }
                } else {
                    textStr = `${i.meta.Height}cm`;
                }
                const textX = (leftX + rightX) / 2;
                const textY = topYCoord - 5;

                // White outline
                ctx.strokeStyle = "white";
                ctx.lineWidth = 4;
                ctx.strokeText(textStr, textX, textY);

                // Dark fill
                ctx.fillStyle = "#333333";
                ctx.fillText(textStr, textX, textY);
            }
        });

        // Calculate initial zoom so it fits the container
        const container = document.querySelector('.canvas-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Leave some padding (e.g. 80px total = 40px each side)
        const padding = 80;
        const scaleX = (containerWidth - padding) / totalWidth;
        const scaleY = (containerHeight - padding) / canvasHeight;

        // Start with a zoom that fits the whole image, max 1.0
        currentZoom = Math.min(1.0, scaleX, scaleY);
        if (currentZoom < 0.05) currentZoom = 0.05;

        applyZoom();

        // Enable download
        btnDownload.disabled = false;

    } catch (err) {
        console.error(err);
        showToast(t('alert-error') + err.message, 'error');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

function downloadCanvas() {
    const link = document.createElement('a');
    link.download = 'HeightChart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Start app
init();
