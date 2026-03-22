(function() {
  'use strict';

  // ---- State ----
  let pdfFiles = []; // { id, file, name, size, pageCount, pages: [{removed, thumbCanvas}], thumbCanvas }
  let mergedBytes = null;
  let mergedUrl = null;
  let idCounter = 0;

  // ---- DOM refs ----
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => (p || document).querySelectorAll(s);

  const dropZoneEmpty = $('.drop-zone-empty');
  const appLoaded = $('.app-loaded');
  const fileInput = $('#file-input');
  const fileInputMini = $('#file-input-mini');
  const fileList = $('.file-list');
  const fileStats = $('.file-stats');
  const statusLeft = $('#status-left');
  const mergeBtn = $('#merge-btn');
  const downloadBtn = $('#download-btn');
  const mergeAgainBtn = $('#merge-again-btn');
  const progressSection = $('.progress-section');
  const progressFill = $('.progress-bar-fill');
  const progressText = $('.progress-text');
  const downloadSection = $('.download-section');
  const outputInfo = $('.output-info');
  const statFiles = $('#stat-files');
  const statPages = $('#stat-pages');
  const statSize = $('#stat-size');
  const clearBtn = $('#clear-btn');
  const dropZoneMini = $('.drop-zone-mini');
  const toastContainer = $('.toast-container');

  // ---- Theme ----
  function initTheme() {
    const saved = localStorage.getItem('suite_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }
  initTheme();

  $('.theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('suite_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });

  // ---- Toast ----
  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---- Utilities ----
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function totalPages() {
    let c = 0;
    for (const f of pdfFiles) {
      for (const p of f.pages) { if (!p.removed) c++; }
    }
    return c;
  }

  function totalSize() {
    let s = 0;
    for (const f of pdfFiles) s += f.size;
    return s;
  }

  // ---- PDF validation ----
  function isPDF(arrayBuffer) {
    const header = new Uint8Array(arrayBuffer, 0, 5);
    return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2D;
  }

  // ---- Thumbnail rendering ----
  async function renderThumb(arrayBuffer, pageIndex, width) {
    const canvas = document.createElement('canvas');
    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageIndex + 1);
      const vp = page.getViewport({ scale: 1 });
      const scale = width / vp.width;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      pdf.destroy();
    } catch (e) {
      canvas.width = width;
      canvas.height = width * 1.414;
    }
    return canvas;
  }

  // ---- Add files ----
  async function addFiles(fileListObj) {
    const files = Array.from(fileListObj).filter(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        showToast('Only PDF files are supported. ' + f.name + ' was skipped.');
        return false;
      }
      if (f.size > 100 * 1024 * 1024) {
        showToast('Large file — processing may be slow');
      }
      return true;
    });

    if (pdfFiles.length + files.length > 50) {
      showToast('Recommended maximum is 50 files.');
    }

    const currentTotalSize = totalSize();
    let runningSize = currentTotalSize;

    for (const file of files) {
      runningSize += file.size;
      if (runningSize > 500 * 1024 * 1024) {
        showToast('Total size exceeds 500MB limit. Some files were skipped.');
        break;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();

        if (!isPDF(arrayBuffer)) {
          showToast('Could not read ' + file.name + ' — the file may be corrupted.');
          continue;
        }

        // Check for encryption
        let pageCount;
        try {
          const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
          pageCount = pdfDoc.getPageCount();
        } catch (e) {
          if (e.message && (e.message.includes('encrypt') || e.message.includes('password'))) {
            showToast('This PDF is password-protected and cannot be merged.');
            continue;
          }
          showToast('Could not read ' + file.name + ' — the file may be corrupted.');
          continue;
        }

        const thumbCanvas = await renderThumb(arrayBuffer, 0, 84);
        const pages = [];
        for (let i = 0; i < pageCount; i++) {
          pages.push({ removed: false, thumbCanvas: null, index: i });
        }

        pdfFiles.push({
          id: ++idCounter,
          file,
          arrayBuffer,
          name: file.name,
          size: file.size,
          pageCount,
          pages,
          thumbCanvas,
          expanded: false
        });
      } catch (e) {
        if (e.message && e.message.includes('memory')) {
          showToast('Not enough memory to process these files. Try fewer or smaller PDFs.');
        } else {
          showToast('Could not read ' + file.name + ' — the file may be corrupted.');
        }
      }
    }

    clearMergedResult();
    updateUI();
  }

  // ---- Render file list ----
  function updateUI() {
    const hasFiles = pdfFiles.length > 0;
    dropZoneEmpty.style.display = hasFiles ? 'none' : '';
    appLoaded.classList.toggle('active', hasFiles);

    if (!hasFiles) {
      fileList.innerHTML = '';
      updateStats();
      return;
    }

    fileList.innerHTML = '';
    pdfFiles.forEach((pf, idx) => {
      const card = document.createElement('div');
      card.className = 'file-card';
      card.dataset.id = pf.id;
      card.draggable = true;

      const activePages = pf.pages.filter(p => !p.removed).length;

      card.innerHTML = `
        <div class="file-card-main">
          <span class="drag-handle" title="Drag to reorder">☰</span>
          <div class="file-thumb"></div>
          <div class="file-info">
            <div class="file-name" title="${pf.name}">${pf.name}</div>
            <div class="file-meta">${activePages} page${activePages !== 1 ? 's' : ''} · ${formatSize(pf.size)}</div>
          </div>
          <div class="file-actions">
            <button class="btn-icon chevron-btn" title="Show pages"><span class="chevron ${pf.expanded ? 'open' : ''}">▶</span></button>
            <button class="btn-icon remove" title="Remove file">✕</button>
          </div>
        </div>
        <div class="page-grid ${pf.expanded ? 'open' : ''}"></div>
      `;

      // Insert thumbnail
      const thumbContainer = card.querySelector('.file-thumb');
      if (pf.thumbCanvas) {
        thumbContainer.appendChild(pf.thumbCanvas.cloneNode(true));
        const c = thumbContainer.querySelector('canvas');
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.objectFit = 'contain';
      }

      // Expand/collapse
      card.querySelector('.chevron-btn').addEventListener('click', async () => {
        pf.expanded = !pf.expanded;
        if (pf.expanded) {
          await renderPageGrid(pf, card.querySelector('.page-grid'));
        }
        card.querySelector('.chevron').classList.toggle('open', pf.expanded);
        card.querySelector('.page-grid').classList.toggle('open', pf.expanded);
      });

      // Remove file
      card.querySelector('.remove').addEventListener('click', () => {
        pdfFiles = pdfFiles.filter(f => f.id !== pf.id);
        clearMergedResult();
        updateUI();
      });

      // Drag events for file reordering
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', pf.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
        setTimeout(() => card.style.opacity = '0.5', 0);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        card.style.opacity = '';
        $$('.file-card.drag-target-above').forEach(c => c.classList.remove('drag-target-above'));
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        $$('.file-card.drag-target-above').forEach(c => c.classList.remove('drag-target-above'));
        card.classList.add('drag-target-above');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-target-above');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-target-above');
        const dragId = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragId === pf.id) return;
        const fromIdx = pdfFiles.findIndex(f => f.id === dragId);
        const toIdx = pdfFiles.findIndex(f => f.id === pf.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const [moved] = pdfFiles.splice(fromIdx, 1);
        pdfFiles.splice(toIdx, 0, moved);
        clearMergedResult();
        updateUI();
      });

      // Render page grid if expanded
      if (pf.expanded) {
        renderPageGrid(pf, card.querySelector('.page-grid'));
      }

      fileList.appendChild(card);
    });

    updateStats();
  }

  async function renderPageGrid(pf, gridEl) {
    gridEl.innerHTML = '';
    for (let i = 0; i < pf.pages.length; i++) {
      const pg = pf.pages[i];
      if (pg.removed) continue;

      const thumb = document.createElement('div');
      thumb.className = 'page-thumb';
      thumb.draggable = true;
      thumb.dataset.pageIdx = i;

      // Lazy render page thumbnails
      if (!pg.thumbCanvas) {
        pg.thumbCanvas = await renderThumb(pf.arrayBuffer, pg.index, 150);
      }

      const c = pg.thumbCanvas.cloneNode(true);
      c.style.width = '100%';
      c.style.height = '100%';
      c.style.objectFit = 'contain';
      thumb.appendChild(c);

      const numEl = document.createElement('div');
      numEl.className = 'page-num';
      numEl.textContent = pg.index + 1;
      thumb.appendChild(numEl);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'page-remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pg.removed = true;
        clearMergedResult();
        updateUI();
      });
      thumb.appendChild(removeBtn);

      // Page drag-drop reorder
      thumb.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/page-idx', i);
        e.dataTransfer.setData('application/file-id', pf.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      thumb.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        thumb.style.borderColor = 'var(--accent)';
      });
      thumb.addEventListener('dragleave', () => {
        thumb.style.borderColor = '';
      });
      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        thumb.style.borderColor = '';
        const fromFileId = parseInt(e.dataTransfer.getData('application/file-id'));
        if (fromFileId !== pf.id) return;
        const fromIdx = parseInt(e.dataTransfer.getData('application/page-idx'));
        const toIdx = i;
        if (fromIdx === toIdx) return;
        const [moved] = pf.pages.splice(fromIdx, 1);
        pf.pages.splice(toIdx, 0, moved);
        clearMergedResult();
        renderPageGrid(pf, gridEl);
        updateStats();
      });

      gridEl.appendChild(thumb);
    }
  }

  function updateStats() {
    const fc = pdfFiles.length;
    const pc = totalPages();
    const sz = totalSize();

    fileStats.textContent = fc + ' file' + (fc !== 1 ? 's' : '') + ', ' + pc + ' page' + (pc !== 1 ? 's' : '');
    statusLeft.textContent = fc + ' file' + (fc !== 1 ? 's' : '') + ' · ' + pc + ' page' + (pc !== 1 ? 's' : '') + ' · ~' + formatSize(sz);

    statFiles.textContent = fc + ' PDF' + (fc !== 1 ? 's' : '');
    statPages.textContent = pc + ' page' + (pc !== 1 ? 's' : '');
    statSize.textContent = '~' + formatSize(sz);

    mergeBtn.textContent = 'Merge ' + fc + ' PDF' + (fc !== 1 ? 's' : '') + ' into One';
    mergeBtn.disabled = fc === 0;
  }

  // ---- Merge ----
  async function doMerge() {
    if (pdfFiles.length === 0) return;

    progressSection.classList.add('active');
    downloadSection.classList.remove('active');
    mergeBtn.disabled = true;
    progressFill.style.width = '0%';

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      let processed = 0;
      const total = pdfFiles.length;

      for (const pf of pdfFiles) {
        progressText.textContent = 'Merging file ' + (processed + 1) + ' of ' + total + '...';
        progressFill.style.width = ((processed / total) * 100) + '%';

        const pdf = await PDFLib.PDFDocument.load(pf.arrayBuffer);
        const activeIndices = pf.pages
          .filter(p => !p.removed)
          .map(p => p.index);

        if (activeIndices.length > 0) {
          const copiedPages = await mergedPdf.copyPages(pdf, activeIndices);
          copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        processed++;
      }

      progressFill.style.width = '100%';
      progressText.textContent = 'Finalizing...';

      mergedBytes = await mergedPdf.save();
      const totalPg = totalPages();
      const fileName = 'merged-' + pdfFiles.length + '-files.pdf';

      outputInfo.textContent = fileName + ' · ' + totalPg + ' pages · ' + formatSize(mergedBytes.length);

      progressSection.classList.remove('active');
      downloadSection.classList.add('active');
      mergeBtn.disabled = false;

      showToast('PDF merged successfully!');
    } catch (e) {
      progressSection.classList.remove('active');
      mergeBtn.disabled = false;
      if (e.message && e.message.includes('memory')) {
        showToast('Not enough memory to process these files. Try fewer or smaller PDFs.');
      } else {
        showToast('Merge failed: ' + e.message);
      }
    }
  }

  function downloadMerged() {
    if (!mergedBytes) return;
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-' + pdfFiles.length + '-files.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clearMergedResult() {
    mergedBytes = null;
    if (mergedUrl) { URL.revokeObjectURL(mergedUrl); mergedUrl = null; }
    downloadSection.classList.remove('active');
    progressSection.classList.remove('active');
  }

  function clearAll() {
    pdfFiles = [];
    mergedBytes = null;
    if (mergedUrl) { URL.revokeObjectURL(mergedUrl); mergedUrl = null; }
    updateUI();
  }

  // ---- Event listeners ----
  mergeBtn.addEventListener('click', doMerge);
  downloadBtn.addEventListener('click', downloadMerged);
  mergeAgainBtn.addEventListener('click', () => {
    clearMergedResult();
    updateUI();
  });
  clearBtn.addEventListener('click', clearAll);

  // File inputs
  fileInput.addEventListener('change', (e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; });
  fileInputMini.addEventListener('change', (e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; });
  $('#add-more-btn').addEventListener('click', () => fileInputMini.click());

  // Drop zones
  function setupDropZone(el, inputEl) {
    el.addEventListener('click', () => inputEl.click());
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });
  }
  setupDropZone(dropZoneEmpty, fileInput);
  setupDropZone(dropZoneMini, fileInputMini);

  // Global drag-over for body
  document.body.addEventListener('dragover', (e) => e.preventDefault());
  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  // ---- PDF.js worker setup ----
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    // Disable worker since it's inlined
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
  }

  // ---- Init ----
  updateUI();
})();
