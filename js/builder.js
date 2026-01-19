// =====================
// CONFIG (Manual controls)
// =====================

// ✅ Nudge the SOCIAL top-right red tag (in "design pixels" based on 1130-wide photo canvas system)
const SOCIAL_RED_TAG_NUDGE_X = 60; // + right, - left (try 40–120)
const SOCIAL_RED_TAG_NUDGE_Y = 0;  // + down, - up

// Optional: if you want the tag slightly more/less transparent
const SOCIAL_RED_TAG_ALPHA = 0.96;

// =====================
// Helpers
// =====================
function formatDate(dateString, timeString) {
  if (!dateString || !timeString) return '';
  const date = new Date(`${dateString}T${timeString}`);
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return `${date.toLocaleDateString('en-ZA', options)} @ ${timeString}`;
}

async function waitForElement(selector, root = document, timeout = 3000) {
  const start = Date.now();
  while (!root.querySelector(selector)) {
    await new Promise(r => requestAnimationFrame(r));
    if (Date.now() - start > timeout) return null;
  }
  return root.querySelector(selector);
}

function waitForImagesToLoad(container) {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img =>
    new Promise(resolve => {
      if (img.complete) return resolve();
      img.onload = img.onerror = resolve;
    })
  );
  return Promise.all(promises);
}

function waitForRenderFrames(frames = 3) {
  return new Promise(resolve => {
    const step = () => {
      if (frames-- <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ✅ Always builds correct URL for GitHub Pages + local
function absUrl(relativePath) {
  return new URL(relativePath, window.location.href).toString();
}

// =====================
// Image handling
// =====================
function getImageDataUrl(inputId, maxW = 2200, maxH = 2200, quality = 0.9) {
  return new Promise((resolve) => {
    const input = document.getElementById(inputId);
    const file = input?.files?.[0];
    if (!file) return resolve('');

    if (file.size > 8 * 1024 * 1024) {
      alert("⚠️ Please upload an image under 8MB.");
      return resolve('');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);

        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(reader.result || '');
      img.src = reader.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// =====================
// Font resize
// =====================
function adjustFontSize(textbox) {
  const span = textbox.querySelector('span');
  if (!span) return;

  const text = span.innerText;
  const maxWidth = textbox.offsetWidth - 20;
  const maxHeight = textbox.offsetHeight - 20;
  let fontSize = 200;

  const dummy = document.createElement('span');
  dummy.style.visibility = 'hidden';
  dummy.style.position = 'absolute';
  dummy.style.fontFamily = 'Roboto, sans-serif';
  dummy.style.fontSize = fontSize + 'px';
  dummy.innerText = text;
  document.body.appendChild(dummy);

  while (fontSize > 5 && (dummy.offsetWidth > maxWidth || dummy.offsetHeight > maxHeight)) {
    fontSize--;
    dummy.style.fontSize = fontSize + 'px';
  }

  span.style.fontSize = fontSize + 'px';
  document.body.removeChild(dummy);
}

function runFontResize(container, templateId) {
  let ids = [];
  if (templateId.includes('social')) {
    ids = ['textbox_1_Red_Tag', 'textbox_2_Red_Tag', 'textbox_Red_Rectangle', 'textbox_Header_2'];
  } else if (templateId.includes('newsletter')) {
    ids = ['textbox_1_Red_Tag', 'textbox_2_Red_Tag', 'textbox_Property_Heading'];
  } else if (templateId.includes('flyer')) {
    ids = [
      'textbox_1_Red_Banner', 'textbox_2_Red_Banner',
      'textbox_Feature_1', 'textbox_Feature_2', 'textbox_Feature_3',
      'textbox_1_Blue_Overlay', 'textbox_2_Blue_Overlay', 'textbox_3_Blue_Overlay',
      'DATE', 'ADDRESS'
    ];
  }

  ids.forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el && el.querySelector('span')) adjustFontSize(el);
  });
}

// =====================
// Collect form data (global)
// =====================
async function collectFormData() {
  return {
    headline: document.getElementById('headline')?.value || '',
    subheadline: document.getElementById('subheadline')?.value || '',
    subheadline2: document.getElementById('subheadline2')?.value || '',
    city: document.getElementById('city')?.value || '',
    suburb: document.getElementById('suburb')?.value || '',
    tag1: document.getElementById('tag1')?.value || '',
    tag2: document.getElementById('tag2')?.value || '',
    date: formatDate(
      document.getElementById('date-picker')?.value || '',
      document.getElementById('time-picker')?.value || ''
    ),
    time: document.getElementById('time-picker')?.value || '',
    address: document.getElementById('address')?.value || '',
    feat1: document.getElementById('feat1')?.value || '',
    feat2: document.getElementById('feat2')?.value || '',
    feat3: document.getElementById('feat3')?.value || '',
    propertyImage: await getImageDataUrl('property-img')
  };
}

// =====================
// Canvas draws (return Promises so downloads wait correctly)
// =====================
function drawFlyerCanvasImage(imageDataUrl, target) {
  return new Promise((resolve) => {
    const canvas = target.querySelector('#flyer-property-canvas');
    if (!canvas || !imageDataUrl) return resolve();

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = imageDataUrl;
  });
}

function drawNewsletterCanvasImage(imageDataUrl, target) {
  return new Promise((resolve) => {
    const canvas = target.querySelector('#property-canvas');
    if (!canvas || !imageDataUrl) return resolve();

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = imageDataUrl;
  });
}

function drawSocialCanvasImage(imageDataUrl, target) {
  return new Promise((resolve) => {
    const canvas = target.querySelector('#social-property-canvas');
    if (!canvas || !imageDataUrl) return resolve();

    const ctx = canvas.getContext('2d');

    const propertyImg = new Image();
    propertyImg.crossOrigin = 'anonymous';

    propertyImg.onload = () => {
      const scale = Math.max(canvas.width / propertyImg.width, canvas.height / propertyImg.height);
      const x = (canvas.width - propertyImg.width * scale) / 2;
      const y = (canvas.height - propertyImg.height * scale) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(propertyImg, x, y, propertyImg.width * scale, propertyImg.height * scale);

      // ✅ draw the red tag only AFTER photo is drawn
      const redTag = new Image();
      redTag.crossOrigin = 'anonymous';

      redTag.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = SOCIAL_RED_TAG_ALPHA;

        // Your mapping is based on the 1130 photo canvas area
        const scaleFactor = canvas.width / 1130;

        const redTagWidth = 490 * scaleFactor;
        const redTagHeight = 462 * scaleFactor;

        const redTagX = ((718 - 40) + SOCIAL_RED_TAG_NUDGE_X) * scaleFactor;
        const redTagY = (0 + SOCIAL_RED_TAG_NUDGE_Y) * scaleFactor;

        ctx.drawImage(redTag, redTagX, redTagY, redTagWidth, redTagHeight);
        ctx.restore();

        resolve(); // ✅ done
      };

      redTag.onerror = () => resolve();

      // ✅ Use absolute URL so GitHub Pages always finds it
      redTag.src = absUrl('assets/red-tag.png');
    };

    propertyImg.onerror = () => resolve();
    propertyImg.src = imageDataUrl;
  });
}

// =====================
// Template load + populate (WAIT for canvas draws)
// =====================
async function loadTemplate(templatePath, targetId, data) {
  const res = await fetch(absUrl(templatePath), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load template: ${templatePath} (${res.status})`);

  let html = await res.text();
  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key] ?? '');
  }

  const target = document.getElementById(targetId);
  if (!target) throw new Error(`Target not found: ${targetId}`);

  target.innerHTML = html;
  await waitForImagesToLoad(target);

  // ✅ WAIT for canvas drawing to finish
  if (templatePath.includes('newsletter')) {
    await drawNewsletterCanvasImage(data.propertyImage, target);
  } else if (templatePath.includes('social')) {
    await drawSocialCanvasImage(data.propertyImage, target);
  } else if (templatePath.includes('flyer')) {
    await drawFlyerCanvasImage(data.propertyImage, target);
  }

  const container = await waitForElement('[id^="capture-container"]', target, 4000);
  if (container) runFontResize(container, targetId);

  await waitForRenderFrames(3);
}

// =====================
// UI actions
// =====================
async function generateTemplate(template) {
  const data = await collectFormData();
  const map = {
    social: { path: 'templates/social.html', target: 'social-preview' },
    newsletter: { path: 'templates/newsletter.html', target: 'newsletter-preview' },
    flyer: { path: 'templates/flyer.html', target: 'flyer-preview' }
  };

  const cfg = map[template];
  if (!cfg) throw new Error(`Unknown template: ${template}`);

  await loadTemplate(cfg.path, cfg.target, data);
}

async function generateAndDownload(template) {
  try {
    const data = await collectFormData();

    const map = {
      social: { path: 'templates/social.html', target: 'social-preview', filename: 'social.jpg' },
      newsletter: { path: 'templates/newsletter.html', target: 'newsletter-preview', filename: 'newsletter.jpg' },
      flyer: { path: 'templates/flyer.html', target: 'flyer-preview', filename: 'flyer.jpg' }
    };

    const cfg = map[template];
    if (!cfg) throw new Error(`Unknown template: ${template}`);

    const { path, target, filename } = cfg;
    const previewWrapper = document.getElementById(target);
    if (!previewWrapper) throw new Error(`Preview wrapper not found: ${target}`);

    await loadTemplate(path, target, data);

    const container = await waitForElement('[id^="capture-container"]', previewWrapper, 6000);
    if (!container) throw new Error("Template container not found.");
    if (container.offsetWidth === 0 || container.offsetHeight === 0) throw new Error("Template container not rendered.");

    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = 1;
    container.style.pointerEvents = 'auto';
    container.style.position = 'static';

    await waitForImagesToLoad(container);
    await waitForRenderFrames(4);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("❌ Export failed (blob was null).");
        return;
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);

      container.style.display = 'none';
      container.style.position = 'absolute';
      container.style.opacity = 0;
      container.style.pointerEvents = 'none';
    }, "image/jpeg", 0.92);

  } catch (err) {
    console.error(err);
    alert("❌ Design export failed: " + (err?.message || err));
  }
}

// =====================
// Word Summary (keep working)
// =====================
async function downloadWordDoc() {
  const { Document, Packer, Paragraph, TextRun } = window.docx;

  const rawDate = document.getElementById("date-picker")?.value || '';
  const rawTime = document.getElementById("time-picker")?.value || '';
  const fullDateObj = new Date(`${rawDate}T${rawTime}`);

  const formattedDate = fullDateObj.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fullDateTime = `${formattedDate} @ ${rawTime}`;

  const fields = {
    "Headline": document.getElementById("headline")?.value || '',
    "City": document.getElementById("city")?.value || '',
    "Suburb": document.getElementById("suburb")?.value || '',
    "Tagline 1": document.getElementById("tag1")?.value || '',
    "Tagline 2": document.getElementById("tag2")?.value || '',
    "Date & Time": fullDateTime,
    "Feature 1": document.getElementById("feat1")?.value || '',
    "Feature 2": document.getElementById("feat2")?.value || '',
    "Feature 3": document.getElementById("feat3")?.value || ''
  };

  const paragraphs = Object.entries(fields).map(([label, value]) =>
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: label + ": ", bold: true, size: 28, font: "Roboto" }),
        new TextRun({ text: value, size: 24, font: "Roboto" })
      ]
    })
  );

  const doc = new Document({ sections: [{ children: paragraphs }] });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "AuctionInc_Property_Summary.docx";
  a.click();

  URL.revokeObjectURL(url);
}

// =====================
// Export for HTML onclick="..."
// =====================
window.generateTemplate = generateTemplate;
window.generateAndDownload = generateAndDownload;
window.downloadWordDoc = downloadWordDoc;




