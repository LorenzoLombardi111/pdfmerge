const fs = require('fs');

const pdfLib = fs.readFileSync('node_modules/pdf-lib/dist/pdf-lib.min.js', 'utf8');
const pdfJs = fs.readFileSync('node_modules/pdfjs-dist/build/pdf.min.js', 'utf8');
const pdfWorker = fs.readFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.js', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const appJs = fs.readFileSync('src/app.js', 'utf8');
const seoHtml = fs.readFileSync('src/seo.html', 'utf8');

const faqLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is freemergepdf.app really free with no limits?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. freemergepdf.app is completely free to use with no file count limits, no daily usage caps, and no watermarks on the merged output. You can merge as many PDFs as you want, as often as you want, with no restrictions." }
    },
    {
      "@type": "Question",
      "name": "Are my PDF files uploaded to a server?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Your PDF files never leave your browser. All processing happens locally on your device using JavaScript. There is no server-side component." }
    },
    {
      "@type": "Question",
      "name": "Can I rearrange pages before merging?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Click the expand arrow on any file to see all its pages as thumbnails. You can then drag pages to reorder them or click the remove button to exclude specific pages from the merged output." }
    },
    {
      "@type": "Question",
      "name": "What is the maximum file size for merging?",
      "acceptedAnswer": { "@type": "Answer", "text": "freemergepdf.app supports individual files up to 100MB and a combined total of 500MB across all files." }
    },
    {
      "@type": "Question",
      "name": "Can I merge password-protected PDFs?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Password-protected (encrypted) PDFs cannot be merged directly. You will need to remove the password protection first using your PDF reader's security settings." }
    },
    {
      "@type": "Question",
      "name": "Does freemergepdf.app work on mobile?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. freemergepdf.app is fully responsive and works on smartphones and tablets. The interface adapts to smaller screens with touch-friendly controls." }
    }
  ]
};

const softwareLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "freemergepdf.app",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "url": "https://freemergepdf.app/",
  "description": "Free online PDF merger. Combine multiple PDFs in your browser with no upload, no login, no watermarks."
};

const breadcrumbLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://freemergepdf.app/" }
  ]
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free PDF Merger Online - No Upload Required | freemergepdf.app</title>
  <meta name="description" content="Free online PDF merger. Combine multiple PDFs in your browser — no upload, no login, no watermarks. Drag, drop, merge. freemergepdf.app">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://freemergepdf.app/">
  <meta name="theme-color" content="#faf9f6">
  <link rel="manifest" href="/manifest.json">
  <!-- hreflang tags to be added when translations are available -->

  <!-- Open Graph -->
  <meta property="og:title" content="Free PDF Merger Online - No Upload Required | freemergepdf.app">
  <meta property="og:description" content="Combine multiple PDFs in your browser — no upload, no login, no watermarks.">
  <meta property="og:image" content="https://freemergepdf.app/og-image.svg">
  <meta property="og:url" content="https://freemergepdf.app/">
  <meta property="og:type" content="website">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Free PDF Merger Online | freemergepdf.app">
  <meta name="twitter:description" content="Combine multiple PDFs in your browser — no upload, no login, no watermarks.">
  <meta name="twitter:image" content="https://freemergepdf.app/og-image.svg">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">

  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(softwareLD)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLD)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLD)}</script>

  <style>${css}</style>
</head>
<body>
  <header class="header">
    <a href="/" class="brand">freemergepdf.app</a>
    <div class="header-actions">
      <button class="theme-toggle" title="Toggle dark mode">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <button class="btn btn-destructive" id="clear-btn">Clear All</button>
    </div>
  </header>

  <main class="main-area">
    <input type="file" id="file-input" accept=".pdf" multiple>
    <input type="file" id="file-input-mini" accept=".pdf" multiple>

    <!-- Empty state -->
    <div class="drop-zone-empty">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="12" y="6" width="40" height="52" rx="4" stroke-linecap="round"/><path d="M22 6V2h20v4" stroke-linecap="round"/><line x1="22" y1="22" x2="42" y2="22"/><line x1="22" y1="30" x2="42" y2="30"/><line x1="22" y1="38" x2="34" y2="38"/><path d="M36 46l6 6 6-6M42 52V40" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
      <div class="dz-title">Drop PDF files here or click to browse</div>
      <div class="dz-sub">Combine multiple PDFs into one document — free, no upload</div>
    </div>

    <!-- Files loaded layout -->
    <div class="app-loaded">
      <!-- Left: File list -->
      <div class="file-panel">
        <div class="file-panel-header">
          <button class="btn btn-secondary" id="add-more-btn">+ Add more files</button>
          <span class="file-stats">0 files, 0 pages</span>
        </div>
        <div class="file-list"></div>
        <div class="drop-zone-mini">
          <span>Drop more PDFs here or click to add</span>
        </div>
      </div>

      <!-- Right: Action panel -->
      <nav class="action-panel">
        <div class="stat-card">
          <div class="stat-row"><span class="stat-label">Files</span><span class="stat-value" id="stat-files">0 PDFs</span></div>
          <div class="stat-row"><span class="stat-label">Pages</span><span class="stat-value" id="stat-pages">0 pages</span></div>
          <div class="stat-row"><span class="stat-label">Est. Size</span><span class="stat-value" id="stat-size">~0 KB</span></div>
        </div>

        <button class="btn btn-primary btn-lg" id="merge-btn" style="width:100%" disabled>Merge PDFs into One</button>

        <div class="progress-section">
          <div class="progress-bar-track"><div class="progress-bar-fill"></div></div>
          <div class="progress-text">Preparing...</div>
        </div>

        <div class="download-section">
          <div class="success-msg">&#10003; Merged successfully!</div>
          <div class="output-info"></div>
          <button class="btn btn-primary btn-lg" id="download-btn" style="width:100%;margin-bottom:8px">Download Merged PDF</button>
          <button class="btn btn-secondary" id="merge-again-btn" style="width:100%">Merge Again</button>
        </div>

        <div id="upgrade-prompt">
          <div class="up-title">&#128274; PDF Editor &amp; Splitter</div>
          <div class="up-desc">Edit PDF pages, split PDFs into multiple files, add watermarks, and rotate pages</div>
          <a class="up-link" href="https://freesuite.app">Unlock with freesuite.app &middot; $2.88/mo</a>
        </div>
      </nav>
    </div>
  </main>

  <div class="status-bar">
    <span id="status-left">0 files &middot; 0 pages &middot; ~0 KB</span>
    <span>All processing happens in your browser — nothing uploaded</span>
  </div>

  <div class="attribution"><span class="full-text">by freesuite.app</span><span class="short-text">freesuite.app</span></div>
  <div class="toast-container"></div>

  ${seoHtml}

  <!-- pdf-lib -->
  <script>${pdfLib}</script>
  <!-- PDF.js -->
  <script>${pdfJs}</script>
  <!-- PDF.js Worker (inline as blob) -->
  <script>
  (function() {
    var workerCode = ${JSON.stringify(pdfWorker)};
    var blob = new Blob([workerCode], {type: 'application/javascript'});
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
  })();
  </script>
  <!-- App -->
  <script>${appJs}</script>
  <!-- Service Worker -->
  <script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }
  </script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('Built index.html: ' + (html.length / 1024 / 1024).toFixed(2) + ' MB');
