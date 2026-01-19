async function generateAndDownload(template) {
  try {
    const data = await collectFormData();
    const map = {
      social: { path: 'templates/social.html', target: 'social-preview', filename: 'social.png' },
      newsletter: { path: 'templates/newsletter.html', target: 'newsletter-preview', filename: 'newsletter.png' },
      flyer: { path: 'templates/flyer.html', target: 'flyer-preview', filename: 'flyer.png' }
    };

    const { path, target, filename } = map[template];
    const previewWrapper = document.getElementById(target);

    await loadTemplate(path, target, data);
    await new Promise(resolve => requestAnimationFrame(resolve));

    const container = await waitForElement('[id^="capture-container"]', previewWrapper, 3000);
    if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
      throw new Error("Template container could not be rendered.");
    }

    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = 1;
    container.style.pointerEvents = 'auto';
    container.style.position = 'static';

    await waitForImagesToLoad(container);

    // ✅ LET LAYOUT + FONT RESIZE SETTLE BEFORE CAPTURE
    await waitForRenderFrames(3);

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
      link.download = filename.replace(".png", ".jpg");
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
    alert("❌ Design export failed: " + err.message);
  }
}
