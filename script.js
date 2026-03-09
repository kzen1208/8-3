let scene, camera, renderer, heartModel, controls, viewerContainer;
let isAnimating = false;
let hasManualModelControl = false;
const ROSE_ICON_PATH = "img/rose.png";
const DOME_GALLERY_IMAGES = [];
const DOME_GALLERY_DEFAULTS = {
  fit: 0.8,
  fitBasis: "auto",
  minRadius: 600,
  maxRadius: Number.POSITIVE_INFINITY,
  padFactor: 0.25,
  overlayBlurColor: "rgba(40, 0, 0, 0.9)",
  maxVerticalRotationDeg: 0,
  dragSensitivity: 20,
  segments: 34,
  dragDampening: 2,
  openedImageWidth: "250px",
  openedImageHeight: "350px",
  imageBorderRadius: "30px",
  openedImageBorderRadius: "30px",
  autoRotateSpeed: 0.045,
  grayscale: true,
};
const MUSIC_PLAYLIST = [
  // Update this list to change the playlist shown in the right-side player.
  {
    title: "Lễ Đường",
    artist: "Hải Long, Salim, Kai Đinh",
    src: "playlist/LỄ ĐƯỜNG của Hải Long & Salim - KAI ĐINH - Official MV.mp3",
  },
  {
    title: "I LOVE YOU (Always, In Every Way)",
    artist: "Bùi Công Nam, Binz",
    src: "playlist/I LOVE YOU (Always, In Every Way) - Bùi Công Nam Nữ x Binz - Prod. Machiot (special version).mp3",
  },
  {
    title: "Cảm Ơn Người Đã Thức Cùng Tôi",
    artist: "Original Soundtrack",
    src: "playlist/Cảm Ơn Người Đã Thức Cùng Tôi (Original Soundtrack).mp3",
  },
  {
    title: "Cậu - Em Lại Đi Đâu Đấy",
    artist: "Official Music Video",
    src: "playlist/Cáu - em lai di dau day- - Official Music Video.mp3",
  },
  {
    title: "Tâm Trí Lang Thang",
    artist: "Ánh Sáng AZA ft. Negav",
    src: "playlist/tâm trí lang thang - Ánh Sáng AZA ft. Negav (Official Visualizer).mp3",
  },
  {
    title: "Anh Bờ Vai",
    artist: "Vương Bình, Thanh Tân",
    src: "playlist/VƯƠNG BÌNH - Thanh Tân - 'ANH BỜ VAI' Ấn Bản KIM.mp3",
  },
];
const PAGE_LOADING_STATE = {
  pageReady: false,
  modelReady: false,
  hidden: false,
};

document.addEventListener("DOMContentLoaded", function () {
  initPageLoader();
  setupStaggeredMenu();
  setupCurvedLoops();
  setupTextTypes();
  setupDomeGallery();
  initThreeJS();
  setupInteractions();
  setupMusic();
  setupHeartCursor();
});

function initPageLoader() {
  if (document.readyState === "complete") {
    markPageLoaderPageReady();
  } else {
    window.addEventListener("load", markPageLoaderPageReady, { once: true });
  }

  window.setTimeout(() => {
    hidePageLoader();
  }, 9000);
}

function markPageLoaderPageReady() {
  PAGE_LOADING_STATE.pageReady = true;
  tryHidePageLoader();
}

function markPageLoaderModelReady() {
  PAGE_LOADING_STATE.modelReady = true;
  tryHidePageLoader();
}

function tryHidePageLoader() {
  if (!PAGE_LOADING_STATE.pageReady || !PAGE_LOADING_STATE.modelReady) {
    return;
  }

  hidePageLoader();
}

function hidePageLoader() {
  if (PAGE_LOADING_STATE.hidden) {
    return;
  }

  const loader = document.getElementById("page-loader");

  PAGE_LOADING_STATE.hidden = true;
  document.body.classList.remove("is-loading");

  if (!loader) {
    return;
  }

  loader.classList.add("is-hidden");
  window.setTimeout(() => {
    loader.remove();
  }, 500);
}

function setupCurvedLoops() {
  const loops = document.querySelectorAll(".curved-loop-jacket");
  loops.forEach((loop, index) => {
    initCurvedLoop(loop, index);
  });
}

function initCurvedLoop(loop, index) {
  if (loop.dataset.curvedLoopInit === "true") {
    return;
  }

  const marqueeText = loop.dataset.marqueeText || "";
  if (!marqueeText.trim()) {
    return;
  }

  const speed = Number.parseFloat(loop.dataset.speed || "2");
  const curveAmount = Number.parseFloat(loop.dataset.curveAmount || "180");
  const direction = loop.dataset.direction === "right" ? "right" : "left";
  const interactive = loop.dataset.interactive !== "false";
  const text = /(?:\s|\u00A0)$/.test(marqueeText)
    ? marqueeText.replace(/\s+$/, "") + "\u00A0"
    : marqueeText + "\u00A0";
  const pathId = `curved-loop-path-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.classList.add("curved-loop-svg");
  svg.setAttribute("viewBox", "0 0 1440 220");
  svg.setAttribute("aria-hidden", "true");

  const measureText = document.createElementNS(svgNS, "text");
  measureText.classList.add("curved-loop-measure");
  measureText.setAttribute("xml:space", "preserve");
  measureText.textContent = text;

  const defs = document.createElementNS(svgNS, "defs");
  const path = document.createElementNS(svgNS, "path");
  path.id = pathId;
  path.setAttribute("d", buildCurvedLoopPath(curveAmount));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "transparent");
  defs.appendChild(path);

  const textNode = document.createElementNS(svgNS, "text");
  textNode.classList.add("curved-loop-text");
  textNode.setAttribute("font-weight", "700");
  textNode.setAttribute("xml:space", "preserve");

  const textPath = document.createElementNS(svgNS, "textPath");
  textPath.setAttribute("href", `#${pathId}`);
  textPath.setAttribute("startOffset", "0px");
  textPath.setAttribute("xml:space", "preserve");
  textNode.appendChild(textPath);

  svg.appendChild(measureText);
  svg.appendChild(defs);
  svg.appendChild(textNode);
  loop.appendChild(svg);

  const state = {
    currentOffset: 0,
    dragActive: false,
    lastX: 0,
    velocity: 0,
    spacing: 0,
    direction,
    ready: false,
  };

  loop.dataset.curvedLoopInit = "true";

  function wrapOffset(offset) {
    if (!state.spacing) {
      return offset;
    }

    let nextOffset = offset;
    while (nextOffset <= -state.spacing) {
      nextOffset += state.spacing;
    }
    while (nextOffset > 0) {
      nextOffset -= state.spacing;
    }

    return nextOffset;
  }

  function applyOffset() {
    textPath.setAttribute("startOffset", `${state.currentOffset}px`);
  }

  function updateLoopMetrics() {
    const measuredLength = measureText.getComputedTextLength();
    if (!Number.isFinite(measuredLength) || measuredLength <= 0) {
      return;
    }

    state.spacing = measuredLength;
    const repeatCount = Math.max(3, Math.ceil(2600 / measuredLength) + 2);
    textPath.textContent = Array(repeatCount).fill(text).join("");
    state.currentOffset = state.ready
      ? wrapOffset(state.currentOffset)
      : -state.spacing;
    applyOffset();
    state.ready = true;
  }

  function animateLoop() {
    if (state.ready && !state.dragActive) {
      const delta = state.direction === "right" ? speed : -speed;
      state.currentOffset = wrapOffset(state.currentOffset + delta);
      applyOffset();
    }

    requestAnimationFrame(animateLoop);
  }

  if (interactive) {
    loop.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (!state.ready) {
        return;
      }

      state.dragActive = true;
      state.lastX = event.clientX;
      state.velocity = 0;
      loop.classList.add("is-dragging");

      if (typeof loop.setPointerCapture === "function") {
        try {
          loop.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
    });

    loop.addEventListener("pointermove", (event) => {
      if (!state.dragActive || !state.ready) {
        return;
      }

      const deltaX = event.clientX - state.lastX;
      state.lastX = event.clientX;
      state.velocity = deltaX;
      state.currentOffset = wrapOffset(state.currentOffset + deltaX);
      applyOffset();
    });

    const endDrag = (event) => {
      if (!state.dragActive) {
        return;
      }

      state.dragActive = false;
      if (state.velocity !== 0) {
        state.direction = state.velocity > 0 ? "right" : "left";
      }
      loop.classList.remove("is-dragging");

      if (
        event &&
        typeof loop.releasePointerCapture === "function" &&
        typeof event.pointerId === "number"
      ) {
        try {
          loop.releasePointerCapture(event.pointerId);
        } catch (error) {}
      }
    };

    loop.addEventListener("pointerup", endDrag);
    loop.addEventListener("pointercancel", endDrag);
    loop.addEventListener("pointerleave", endDrag);
  }

  let resizeFrame = 0;
  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(updateLoopMetrics);
    },
    { passive: true }
  );

  requestAnimationFrame(updateLoopMetrics);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateLoopMetrics).catch(() => {});
  }
  animateLoop();
}

function buildCurvedLoopPath(curveAmount) {
  const baseline = 110;
  return `M-140,${baseline} Q720,${baseline + curveAmount} 1580,${baseline}`;
}

function setupTextTypes() {
  const textTypeElements = document.querySelectorAll("[data-texts]");
  textTypeElements.forEach((element) => {
    initTextType(element);
  });
}

function initTextType(element) {
  if (element.dataset.textTypeInit === "true") {
    return;
  }

  const texts = parseTextTypeTexts(element.dataset.texts);
  if (!texts.length) {
    return;
  }

  const typingSpeed = textTypeGetNumber(element, "typingSpeed", 50);
  const initialDelay = textTypeGetNumber(element, "initialDelay", 0);
  const pauseDuration = textTypeGetNumber(element, "pauseDuration", 2000);
  const deletingSpeed = textTypeGetNumber(element, "deletingSpeed", 30);
  const loop = textTypeGetBoolean(element, "loop", true);
  const showCursor = textTypeGetBoolean(element, "showCursor", true);
  const hideCursorWhileTyping = textTypeGetBoolean(
    element,
    "hideCursorWhileTyping",
    false
  );
  const startOnVisible = textTypeGetBoolean(
    element,
    "startOnVisible",
    false
  );
  const reverseMode = textTypeGetBoolean(element, "reverseMode", false);
  const cursorCharacter = element.dataset.cursorCharacter || "|";
  const cursorBlinkDuration = textTypeGetNumber(
    element,
    "cursorBlinkDuration",
    0.5
  );
  const variableSpeedEnabled =
    textTypeGetBoolean(element, "variableSpeedEnabled", false) ||
    textTypeGetBoolean(element, "variableSpeed", false);
  const variableSpeedMin = textTypeGetNumber(
    element,
    "variableSpeedMin",
    typingSpeed
  );
  const variableSpeedMax = textTypeGetNumber(
    element,
    "variableSpeedMax",
    typingSpeed
  );
  const textColors = parseTextTypeColors(element.dataset.textColors);

  const content = document.createElement("span");
  content.className = "text-type__content";

  let cursor = null;
  if (showCursor) {
    cursor = document.createElement("span");
    cursor.className = "text-type__cursor";
    cursor.textContent = cursorCharacter;
    cursor.style.setProperty(
      "--cursor-blink-duration",
      `${cursorBlinkDuration}s`
    );
  }

  element.replaceChildren(content);
  if (cursor) {
    element.appendChild(cursor);
  }

  element.dataset.textTypeInit = "true";

  const state = {
    displayedText: "",
    currentCharIndex: 0,
    isDeleting: false,
    currentTextIndex: 0,
    hasStarted: !startOnVisible,
    timeoutId: 0,
  };

  function updateCursorVisibility(currentText) {
    if (!cursor) {
      return;
    }

    const shouldHide =
      hideCursorWhileTyping &&
      (state.currentCharIndex < currentText.length || state.isDeleting);
    cursor.classList.toggle("text-type__cursor--hidden", shouldHide);
  }

  function getRandomSpeed() {
    if (!variableSpeedEnabled) {
      return typingSpeed;
    }

    return (
      Math.random() * (variableSpeedMax - variableSpeedMin) + variableSpeedMin
    );
  }

  function render() {
    const color = textColors.length
      ? textColors[state.currentTextIndex % textColors.length]
      : "inherit";
    content.textContent = state.displayedText;
    content.style.color = color;
  }

  function tick() {
    if (!state.hasStarted) {
      return;
    }

    const sourceText = texts[state.currentTextIndex] || "";
    const currentText = reverseMode
      ? sourceText.split("").reverse().join("")
      : sourceText;

    updateCursorVisibility(currentText);

    if (state.isDeleting) {
      if (state.displayedText === "") {
        state.isDeleting = false;

        if (state.currentTextIndex === texts.length - 1 && !loop) {
          updateCursorVisibility(currentText);
          return;
        }

        state.currentTextIndex = (state.currentTextIndex + 1) % texts.length;
        state.currentCharIndex = 0;
        state.timeoutId = window.setTimeout(tick, pauseDuration);
        return;
      }

      state.timeoutId = window.setTimeout(() => {
        state.displayedText = state.displayedText.slice(0, -1);
        state.currentCharIndex = Math.max(0, state.currentCharIndex - 1);
        render();
        tick();
      }, deletingSpeed);
      return;
    }

    if (state.currentCharIndex < currentText.length) {
      state.timeoutId = window.setTimeout(() => {
        state.displayedText += currentText[state.currentCharIndex];
        state.currentCharIndex += 1;
        render();
        tick();
      }, getRandomSpeed());
      return;
    }

    if (!loop && state.currentTextIndex === texts.length - 1) {
      updateCursorVisibility(currentText);
      return;
    }

    state.timeoutId = window.setTimeout(() => {
      state.isDeleting = true;
      tick();
    }, pauseDuration);
  }

  function startTyping() {
    if (state.hasStarted && !startOnVisible) {
      return;
    }

    state.hasStarted = true;
    const section = element.closest(".confession-section");
    if (section) {
      section.classList.add("show");
    }
    clearTimeout(state.timeoutId);
    state.timeoutId = window.setTimeout(tick, initialDelay);
  }

  if (startOnVisible) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startTyping();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
  } else {
    startTyping();
  }

  render();
}

function parseTextTypeTexts(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch (error) {
    return rawValue
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseTextTypeColors(rawValue) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textTypeGetBoolean(element, key, fallback) {
  const value = element.dataset[key];
  if (value === undefined) {
    return fallback;
  }

  return value !== "false";
}

function textTypeGetNumber(element, key, fallback) {
  const value = Number.parseFloat(element.dataset[key] || "");
  return Number.isFinite(value) ? value : fallback;
}

function setupDomeGallery() {
  const root = document.getElementById("dome-gallery");
  const uploadInput = document.getElementById("gallery-upload");
  const uploadStatus = document.getElementById("gallery-upload-status");
  const uploadLoaderText = document.getElementById(
    "gallery-upload-loader-text"
  );
  const folderPicker = document.getElementById("gallery-folder-picker");

  if (!root) {
    return;
  }

  const gallery = initDomeGallery(root);
  domeUpdateUploadStatus(uploadStatus, gallery.getImageCount());
  let folderOpenTimer = 0;

  function animateFolderPicker() {
    if (!folderPicker) {
      return;
    }

    window.clearTimeout(folderOpenTimer);
    folderPicker.classList.add("is-open");
    folderOpenTimer = window.setTimeout(() => {
      folderPicker.classList.remove("is-open");
    }, 1100);
  }

  async function importFiles(files) {
    const imageFiles = Array.from(files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (!imageFiles.length) {
      return;
    }

    if (uploadInput) {
      uploadInput.disabled = true;
    }
    root.classList.add("is-uploading");
    if (uploadStatus) {
      uploadStatus.textContent = `Đang thêm ${imageFiles.length} ảnh...`;
    }
    if (uploadLoaderText) {
      uploadLoaderText.textContent =
        imageFiles.length === 1
          ? "Đang xếp 1 ảnh vào thư mục..."
          : `Đang xếp ${imageFiles.length} ảnh vào thư mục...`;
    }

    try {
      const newImages = await domeFilesToImageItems(
        imageFiles,
        gallery.getImageCount()
      );
      gallery.addImages(newImages);
      domeUpdateUploadStatus(uploadStatus, gallery.getImageCount());
    } catch (error) {
      console.error("Khong the them anh vao dome gallery.", error);
      if (uploadStatus) {
        uploadStatus.textContent = "Chua them duoc anh, thu lai nhe.";
      }
    } finally {
      root.classList.remove("is-uploading");
      if (uploadInput) {
        uploadInput.disabled = false;
        uploadInput.value = "";
      }
    }
  }

  if (folderPicker && uploadInput) {
    folderPicker.addEventListener("click", () => {
      if (!uploadInput.disabled) {
        animateFolderPicker();
      }
    });

    folderPicker.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      if (!uploadInput.disabled) {
        animateFolderPicker();
        uploadInput.click();
      }
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener("change", async (event) => {
      await importFiles(event.target.files);
    });
  }

  let dragDepth = 0;

  root.addEventListener("dragenter", (event) => {
    if (!domeHasImageFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    dragDepth += 1;
    root.classList.add("is-drag-over");
  });

  root.addEventListener("dragover", (event) => {
    if (!domeHasImageFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    root.classList.add("is-drag-over");
  });

  root.addEventListener("dragleave", (event) => {
    if (!domeHasImageFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      root.classList.remove("is-drag-over");
    }
  });

  root.addEventListener("drop", async (event) => {
    if (!domeHasImageFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    dragDepth = 0;
    root.classList.remove("is-drag-over");
    await importFiles(event.dataTransfer.files);
  });
}

function initDomeGallery(root) {
  if (root.dataset.domeGalleryInit === "true") {
    return root._domeGallery;
  }

  const options = {
    fit: domeGetNumber(root, "fit", DOME_GALLERY_DEFAULTS.fit),
    fitBasis: root.dataset.fitBasis || DOME_GALLERY_DEFAULTS.fitBasis,
    minRadius: domeGetNumber(
      root,
      "minRadius",
      DOME_GALLERY_DEFAULTS.minRadius
    ),
    maxRadius: domeGetNumber(
      root,
      "maxRadius",
      DOME_GALLERY_DEFAULTS.maxRadius
    ),
    padFactor: domeGetNumber(
      root,
      "padFactor",
      DOME_GALLERY_DEFAULTS.padFactor
    ),
    overlayBlurColor:
      root.dataset.overlayBlurColor ||
      DOME_GALLERY_DEFAULTS.overlayBlurColor,
    maxVerticalRotationDeg: domeGetNumber(
      root,
      "maxVerticalRotationDeg",
      DOME_GALLERY_DEFAULTS.maxVerticalRotationDeg
    ),
    dragSensitivity: domeGetNumber(
      root,
      "dragSensitivity",
      DOME_GALLERY_DEFAULTS.dragSensitivity
    ),
    segments: Math.max(
      10,
      Math.round(
        domeGetNumber(root, "segments", DOME_GALLERY_DEFAULTS.segments)
      )
    ),
    dragDampening: domeGetNumber(
      root,
      "dragDampening",
      DOME_GALLERY_DEFAULTS.dragDampening
    ),
    openedImageWidth:
      root.dataset.openedImageWidth ||
      DOME_GALLERY_DEFAULTS.openedImageWidth,
    openedImageHeight:
      root.dataset.openedImageHeight ||
      DOME_GALLERY_DEFAULTS.openedImageHeight,
    imageBorderRadius:
      root.dataset.imageBorderRadius ||
      DOME_GALLERY_DEFAULTS.imageBorderRadius,
    openedImageBorderRadius:
      root.dataset.openedImageBorderRadius ||
      DOME_GALLERY_DEFAULTS.openedImageBorderRadius,
    autoRotateSpeed: domeGetNumber(
      root,
      "autoRotateSpeed",
      DOME_GALLERY_DEFAULTS.autoRotateSpeed
    ),
    grayscale: root.dataset.grayscale !== "false",
  };

  root.dataset.domeGalleryInit = "true";
  root.style.setProperty("--segments-x", options.segments);
  root.style.setProperty("--segments-y", options.segments);
  root.style.setProperty("--overlay-blur-color", options.overlayBlurColor);
  root.style.setProperty("--tile-radius", options.imageBorderRadius);
  root.style.setProperty("--enlarge-radius", options.openedImageBorderRadius);
  root.style.setProperty("--opened-width", options.openedImageWidth);
  root.style.setProperty("--opened-height", options.openedImageHeight);
  root.style.setProperty(
    "--image-filter",
    options.grayscale ? "grayscale(1)" : "none"
  );

  const main = document.createElement("div");
  main.className = "dg-main";

  const stage = document.createElement("div");
  stage.className = "dg-stage";

  const sphere = document.createElement("div");
  sphere.className = "dg-sphere";
  stage.appendChild(sphere);

  const overlay = document.createElement("div");
  overlay.className = "dg-overlay";

  const overlayBlur = document.createElement("div");
  overlayBlur.className = "dg-overlay dg-overlay--blur";

  const edgeFadeTop = document.createElement("div");
  edgeFadeTop.className = "dg-edge-fade dg-edge-fade--top";

  const edgeFadeBottom = document.createElement("div");
  edgeFadeBottom.className = "dg-edge-fade dg-edge-fade--bottom";

  const viewer = document.createElement("div");
  viewer.className = "dg-viewer";

  const scrim = document.createElement("button");
  scrim.className = "dg-scrim";
  scrim.type = "button";
  scrim.setAttribute("aria-label", "Đóng ảnh");

  const viewerPanel = document.createElement("div");
  viewerPanel.className = "dg-viewer-panel";

  const closeButton = document.createElement("button");
  closeButton.className = "dg-close glass-surface-button glass-surface-button--icon";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Đóng ảnh");
  closeButton.innerHTML = "&times;";

  const viewerImage = document.createElement("img");
  viewerImage.draggable = false;
  viewerImage.alt = "";

  viewerPanel.appendChild(closeButton);
  viewerPanel.appendChild(viewerImage);
  viewer.appendChild(scrim);
  viewer.appendChild(viewerPanel);

  main.appendChild(stage);
  main.appendChild(overlay);
  main.appendChild(overlayBlur);
  main.appendChild(edgeFadeTop);
  main.appendChild(edgeFadeBottom);
  main.appendChild(viewer);
  root.appendChild(main);

  const state = {
    rotation: { x: 0, y: 0 },
    startRotation: { x: 0, y: 0 },
    startPosition: null,
    lastPointerPosition: null,
    activePointerId: null,
    dragging: false,
    moved: false,
    lastDragEndAt: 0,
    velocityX: 0,
    velocityY: 0,
    inertiaFrame: 0,
    viewerOpen: false,
    autoRotateResumeAt: 0,
  };
  const currentImages = [];

  function hasRenderableItems() {
    return sphere.childElementCount > 0;
  }

  function renderItems(images) {
    sphere.replaceChildren();
    closeViewer();
    currentImages.length = 0;
    currentImages.push(...images);
    root.dataset.hasImages = currentImages.length ? "true" : "false";

    const items = currentImages.length
      ? domeBuildItems(currentImages, options.segments)
      : domeBuildPlaceholderItems(options.segments);

    items.forEach((itemData, index) => {
      const item = document.createElement("div");
      item.className = "dg-item";
      item.style.setProperty("--offset-x", itemData.x);
      item.style.setProperty("--offset-y", itemData.y);
      item.style.setProperty("--item-size-x", itemData.sizeX);
      item.style.setProperty("--item-size-y", itemData.sizeY);

      const button = document.createElement("button");
      button.className = "dg-item__image";
      button.type = "button";
      if (itemData.src) {
        button.setAttribute(
          "aria-label",
          itemData.alt || `Mở ảnh số ${index + 1}`
        );

        const image = document.createElement("img");
        image.src = itemData.src;
        image.alt = itemData.alt || `Ảnh số ${index + 1}`;
        image.draggable = false;
        button.appendChild(image);
      } else {
        button.classList.add("is-placeholder");
        button.tabIndex = -1;
        button.setAttribute("aria-hidden", "true");

        const placeholder = document.createElement("span");
        placeholder.className = "dg-item__placeholder";
        placeholder.innerHTML = `
          <span class="dg-item__placeholder-top">
            <span class="dg-item__placeholder-dot"></span>
            <span class="dg-item__placeholder-pill"></span>
          </span>
          <span class="dg-item__placeholder-lines">
            <span class="dg-item__placeholder-line"></span>
            <span class="dg-item__placeholder-line dg-item__placeholder-line--short"></span>
            <span class="dg-item__placeholder-line dg-item__placeholder-line--tiny"></span>
          </span>
        `;
        button.appendChild(placeholder);
      }

      item.appendChild(button);
      sphere.appendChild(item);

      if (itemData.src) {
        button.addEventListener("click", () => {
          if (
            state.dragging ||
            state.moved ||
            performance.now() - state.lastDragEndAt < 120 ||
            state.viewerOpen
          ) {
            return;
          }

          openViewer(itemData);
        });
      }
    });
  }

  function applyTransform(xDeg, yDeg) {
    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  }

  function updateRadius() {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    const aspect = width / height;
    let basis;

    switch (options.fitBasis) {
      case "min":
        basis = minDim;
        break;
      case "max":
        basis = maxDim;
        break;
      case "width":
        basis = width;
        break;
      case "height":
        basis = height;
        break;
      default:
        basis = aspect >= 1.3 ? width : minDim;
    }

    let radius = basis * options.fit;
    radius = Math.min(radius, height * 1.35);
    radius = domeClamp(radius, options.minRadius, options.maxRadius);
    const viewerPad = Math.max(10, Math.round(minDim * options.padFactor));

    root.style.setProperty("--radius", `${Math.round(radius)}px`);
    root.style.setProperty("--viewer-pad", `${viewerPad}px`);
    applyTransform(state.rotation.x, state.rotation.y);
  }

  function stopInertia() {
    if (state.inertiaFrame) {
      cancelAnimationFrame(state.inertiaFrame);
      state.inertiaFrame = 0;
    }
  }

  function startInertia(vx, vy) {
    const maxVelocity = 1.4;
    let velocityX = domeClamp(vx, -maxVelocity, maxVelocity) * 80;
    let velocityY = domeClamp(vy, -maxVelocity, maxVelocity) * 80;
    let frames = 0;
    const damp = domeClamp(options.dragDampening, 0, 1);
    const friction = 0.94 + 0.055 * damp;
    const stopThreshold = 0.015 - 0.01 * damp;
    const maxFrames = Math.round(90 + 270 * damp);

    const step = () => {
      velocityX *= friction;
      velocityY *= friction;

      if (
        Math.abs(velocityX) < stopThreshold &&
        Math.abs(velocityY) < stopThreshold
      ) {
        state.inertiaFrame = 0;
        return;
      }

      if (++frames > maxFrames) {
        state.inertiaFrame = 0;
        return;
      }

      const nextX = domeClamp(
        state.rotation.x - velocityY / 200,
        -options.maxVerticalRotationDeg,
        options.maxVerticalRotationDeg
      );
      const nextY = domeWrapAngleSigned(state.rotation.y + velocityX / 200);

      state.rotation = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
      state.inertiaFrame = requestAnimationFrame(step);
    };

    stopInertia();
    state.inertiaFrame = requestAnimationFrame(step);
  }

  function openViewer(itemData) {
    state.viewerOpen = true;
    state.autoRotateResumeAt = performance.now() + 1600;
    viewerImage.src = itemData.src;
    viewerImage.alt = itemData.alt || "Ảnh 8/3";
    root.setAttribute("data-viewer-open", "true");
    document.body.classList.add("dg-scroll-lock");
  }

  function closeViewer() {
    if (!state.viewerOpen) {
      return;
    }

    state.viewerOpen = false;
    state.autoRotateResumeAt = performance.now() + 1200;
    root.removeAttribute("data-viewer-open");
    document.body.classList.remove("dg-scroll-lock");

    setTimeout(() => {
      if (!state.viewerOpen) {
        viewerImage.removeAttribute("src");
        viewerImage.alt = "";
      }
    }, 360);
  }

  main.addEventListener("pointerdown", (event) => {
    if (state.viewerOpen || !hasRenderableItems()) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    stopInertia();
    state.autoRotateResumeAt = performance.now() + 1800;
    state.activePointerId = event.pointerId;
    state.dragging = true;
    state.moved = false;
    state.startRotation = { ...state.rotation };
    state.startPosition = { x: event.clientX, y: event.clientY };
    state.lastPointerPosition = { x: event.clientX, y: event.clientY };
    state.velocityX = 0;
    state.velocityY = 0;

    if (typeof main.setPointerCapture === "function") {
      try {
        main.setPointerCapture(event.pointerId);
      } catch (error) {}
    }
  });

  main.addEventListener("pointermove", (event) => {
    if (!state.dragging || event.pointerId !== state.activePointerId) {
      return;
    }

    const dxTotal = event.clientX - state.startPosition.x;
    const dyTotal = event.clientY - state.startPosition.y;

    if (!state.moved && dxTotal * dxTotal + dyTotal * dyTotal > 16) {
      state.moved = true;
    }

    const nextX = domeClamp(
      state.startRotation.x - dyTotal / options.dragSensitivity,
      -options.maxVerticalRotationDeg,
      options.maxVerticalRotationDeg
    );
    const nextY = domeWrapAngleSigned(
      state.startRotation.y + dxTotal / options.dragSensitivity
    );

    state.rotation = { x: nextX, y: nextY };
    applyTransform(nextX, nextY);

    state.velocityX = event.clientX - state.lastPointerPosition.x;
    state.velocityY = event.clientY - state.lastPointerPosition.y;
    state.lastPointerPosition = { x: event.clientX, y: event.clientY };
  });

  const endDrag = (event) => {
    if (!state.dragging) {
      return;
    }

    if (
      event &&
      event.type !== "pointerleave" &&
      event.pointerId !== state.activePointerId
    ) {
      return;
    }

    state.dragging = false;

    if (state.moved) {
      state.lastDragEndAt = performance.now();
    }

    if (
      Math.abs(state.velocityX) > 0.2 ||
      Math.abs(state.velocityY) > 0.2
    ) {
      startInertia(
        state.velocityX / options.dragSensitivity,
        state.velocityY / options.dragSensitivity
      );
    }

    if (
      event &&
      typeof main.releasePointerCapture === "function" &&
      typeof event.pointerId === "number"
    ) {
      try {
        main.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }

    state.activePointerId = null;

    requestAnimationFrame(() => {
      state.moved = false;
    });
  };

  main.addEventListener("pointerup", endDrag);
  main.addEventListener("pointercancel", endDrag);
  main.addEventListener("pointerleave", endDrag);

  scrim.addEventListener("click", closeViewer);
  closeButton.addEventListener("click", closeViewer);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeViewer();
    }
  });

  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(() => {
      updateRadius();
    });
    resizeObserver.observe(root);
  } else {
    window.addEventListener("resize", updateRadius, { passive: true });
  }

  function animateAutoRotate() {
    if (
      hasRenderableItems() &&
      !state.dragging &&
      !state.viewerOpen &&
      !state.inertiaFrame &&
      performance.now() >= state.autoRotateResumeAt
    ) {
      state.rotation.y = domeWrapAngleSigned(
        state.rotation.y + options.autoRotateSpeed
      );
      applyTransform(state.rotation.x, state.rotation.y);
    }

    requestAnimationFrame(animateAutoRotate);
  }

  updateRadius();
  applyTransform(state.rotation.x, state.rotation.y);
  renderItems(DOME_GALLERY_IMAGES);
  animateAutoRotate();

  const api = {
    addImages(newImages) {
      if (!Array.isArray(newImages) || newImages.length === 0) {
        return currentImages.length;
      }

      renderItems([...currentImages, ...newImages]);
      return currentImages.length;
    },
    getImageCount() {
      return currentImages.length;
    },
  };

  root._domeGallery = api;
  return api;
}

function domeGetNumber(root, key, fallback) {
  const value = Number.parseFloat(root.dataset[key] || "");
  return Number.isFinite(value) ? value : fallback;
}

function domeClamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function domeWrapAngleSigned(deg) {
  const angle = (((deg + 180) % 360) + 360) % 360;
  return angle - 180;
}

function domeBuildItems(pool, segments) {
  const xColumns = Array.from({ length: segments }, (_, index) => -37 + index * 2);
  const evenRows = [-4, -2, 0, 2, 4];
  const oddRows = [-3, -1, 1, 3, 5];

  const coordinates = xColumns.flatMap((x, columnIndex) => {
    const rows = columnIndex % 2 === 0 ? evenRows : oddRows;
    return rows.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  if (pool.length === 0) {
    return coordinates.map((coordinate) => ({
      ...coordinate,
      src: "",
      alt: "",
    }));
  }

  const normalizedImages = pool.map((image) => {
    if (typeof image === "string") {
      return { src: image, alt: "" };
    }

    return { src: image.src || "", alt: image.alt || "" };
  });

  const usedImages = Array.from({ length: coordinates.length }, (_, index) => {
    return normalizedImages[index % normalizedImages.length];
  });

  for (let index = 1; index < usedImages.length; index++) {
    if (usedImages[index].src === usedImages[index - 1].src) {
      for (
        let swapIndex = index + 1;
        swapIndex < usedImages.length;
        swapIndex++
      ) {
        if (usedImages[swapIndex].src !== usedImages[index].src) {
          const temp = usedImages[index];
          usedImages[index] = usedImages[swapIndex];
          usedImages[swapIndex] = temp;
          break;
        }
      }
    }
  }

  return coordinates.map((coordinate, index) => ({
    ...coordinate,
    src: usedImages[index].src,
    alt: usedImages[index].alt,
  }));
}

function domeBuildPlaceholderItems(segments) {
  return domeBuildItems([], segments).filter(
    (_, index) => index % 4 === 0 || index % 11 === 0
  );
}

async function domeFilesToImageItems(files, startIndex = 0) {
  const loadedImages = await Promise.all(
    files.map(async (file, index) => {
      const src = await domeReadFileAsDataUrl(file);
      if (!src) {
        return null;
      }

      return {
        src,
        alt: domeFormatUploadAlt(file.name, startIndex + index + 1),
      };
    })
  );

  return loadedImages.filter(Boolean);
}

function domeReadFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function domeFormatUploadAlt(fileName, fallbackIndex) {
  const label = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  return label || `Ảnh tải lên ${fallbackIndex}`;
}

function domeUpdateUploadStatus(statusElement, count) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent =
    count > 0 ? `Đã thêm ${count} ảnh` : "Chưa có ảnh";
}

function domeHasImageFiles(dataTransfer) {
  if (!dataTransfer) {
    return false;
  }

  if (
    Array.from(dataTransfer.types || []).includes("Files") &&
    (!dataTransfer.items || dataTransfer.items.length === 0)
  ) {
    return true;
  }

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return Array.from(dataTransfer.files).some((file) =>
      file.type.startsWith("image/")
    );
  }

  return Array.from(dataTransfer.items || []).some(
    (item) => item.kind === "file" && item.type.startsWith("image/")
  );
}

function setupHeartCursor() {
  const container = document.getElementById("heart-cursor-container");

  let lastTime = 0;

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastTime < 50) return; // Throttle
    lastTime = now;

    for (let i = 0; i < 3; i++) {
      const heart = document.createElement("div");
      heart.className = "cursor-heart";
      heart.innerHTML = createRoseIconMarkup("cursor-heart-icon");
      heart.style.left = e.clientX + "px";
      heart.style.top = e.clientY + "px";

      const dx = (Math.random() - 0.5) * 60;
      const dy = -Math.random() * 40 - 20;
      const rotation = (Math.random() - 0.5) * 360;

      heart.style.setProperty("--dx", dx + "px");
      heart.style.setProperty("--dy", dy + "px");
      heart.style.setProperty("--rotation", rotation + "deg");

      container.appendChild(heart);

      setTimeout(() => heart.remove(), 800);
    }
  });
}

function setupMusic() {
  const music = document.getElementById("background-music");
  const card = document.getElementById("music-player-card");
  const mobileToggleButton = document.getElementById("music-mobile-toggle");
  const coverButton = document.getElementById("music-cover-button");
  const playButton = document.getElementById("music-play");
  const prevButton = document.getElementById("music-prev");
  const nextButton = document.getElementById("music-next");
  const shuffleButton = document.getElementById("music-shuffle");
  const playlistToggleButton = document.getElementById("music-playlist-toggle");
  const muteButton = document.getElementById("music-mute");
  const repeatButton = document.getElementById("music-repeat");
  const seekInput = document.getElementById("music-seek");
  const trackName = document.getElementById("music-track-name");
  const trackArtist = document.getElementById("music-track-artist");
  const trackCount = document.getElementById("music-track-count");
  const currentTime = document.getElementById("music-current-time");
  const durationTime = document.getElementById("music-duration");
  const playlistPanel = document.getElementById("music-playlist-panel");
  const playlistList = document.getElementById("music-playlist");
  const playlistSize = document.getElementById("music-playlist-size");

  if (
    !music ||
    !card ||
    !mobileToggleButton ||
    !coverButton ||
    !playButton ||
    !prevButton ||
    !nextButton ||
    !shuffleButton ||
    !playlistToggleButton ||
    !muteButton ||
    !repeatButton ||
    !seekInput ||
    !trackName ||
    !trackArtist ||
    !trackCount ||
    !currentTime ||
    !durationTime ||
    !playlistPanel ||
    !playlistList ||
    !playlistSize
  ) {
    return;
  }

  const tracks = MUSIC_PLAYLIST.filter((track) => track && track.src).map(
    (track, index) => ({
      title: track.title || `Bài hát ${index + 1}`,
      artist: track.artist || "Playlist 8/3",
      src: track.src,
    })
  );

  if (!tracks.length) {
    card.hidden = true;
    return;
  }

  const state = {
    index: 0,
    shuffle: false,
    repeat: true,
    playlistOpen: false,
    mobileCollapsed: false,
  };
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  music.volume = 0.3;
  music.loop = false;
  music.preload = "metadata";

  function formatTrackCount(count) {
    return `${count} bài`;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }

  function setPlaylistOpen(isOpen) {
    state.playlistOpen = isOpen;
    card.classList.toggle("is-playlist-open", isOpen);
    playlistPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    playlistToggleButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );
  }

  function setMobileCollapsed(isCollapsed) {
    const nextCollapsed = mobileQuery.matches ? isCollapsed : false;
    state.mobileCollapsed = nextCollapsed;

    if (nextCollapsed) {
      setPlaylistOpen(false);
    }

    card.classList.toggle("is-collapsed", nextCollapsed);
    mobileToggleButton.setAttribute(
      "aria-expanded",
      nextCollapsed ? "false" : "true"
    );
    mobileToggleButton.setAttribute(
      "aria-label",
      nextCollapsed ? "Mở trình phát nhạc" : "Thu gọn trình phát nhạc"
    );
  }

  function syncMobilePlayer(forceCollapse = false) {
    if (mobileQuery.matches) {
      setMobileCollapsed(forceCollapse ? true : state.mobileCollapsed);
      return;
    }

    setMobileCollapsed(false);
  }

  function updateTrackMeta() {
    const activeTrack = tracks[state.index];
    trackName.textContent = activeTrack.title;
    trackArtist.textContent = activeTrack.artist;
    trackName.title = activeTrack.title;
    trackArtist.title = activeTrack.artist;
    trackCount.textContent = `Playlist ${state.index + 1} / ${tracks.length}`;
    playlistSize.textContent = formatTrackCount(tracks.length);
  }

  function updateTimeline() {
    const duration = Number.isFinite(music.duration) ? music.duration : 0;
    const elapsed = Number.isFinite(music.currentTime) ? music.currentTime : 0;

    currentTime.textContent = formatTime(elapsed);
    durationTime.textContent = formatTime(duration);
    seekInput.value = duration > 0 ? ((elapsed / duration) * 100).toFixed(2) : "0";
  }

  function updatePlayState() {
    const isPlaying = !music.paused;
    const playIcon = isPlaying ? "ri-pause-fill" : "ri-play-fill";
    playButton.innerHTML = `<i class="${playIcon}" aria-hidden="true"></i>`;
    playButton.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc" : "Phát nhạc");
    coverButton.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc" : "Phát nhạc");
    card.classList.toggle("is-playing", isPlaying);
  }

  function updateOptionButtons() {
    shuffleButton.classList.toggle("is-active", state.shuffle);
    shuffleButton.setAttribute("aria-pressed", state.shuffle ? "true" : "false");

    repeatButton.classList.toggle("is-active", state.repeat);
    repeatButton.setAttribute("aria-pressed", state.repeat ? "true" : "false");

    muteButton.classList.toggle("is-active", music.muted);
    muteButton.setAttribute("aria-pressed", music.muted ? "true" : "false");
    muteButton.setAttribute("aria-label", music.muted ? "Bật tiếng" : "Tắt tiếng");
    muteButton.innerHTML = music.muted
      ? '<i class="ri-volume-mute-fill" aria-hidden="true"></i>'
      : '<i class="ri-volume-up-fill" aria-hidden="true"></i>';
  }

  function renderPlaylist() {
    playlistList.replaceChildren();

    tracks.forEach((track, index) => {
      const item = document.createElement("li");
      item.className = "music-playlist-item";

      if (index === state.index) {
        item.classList.add("is-active");
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "music-playlist-button";
      button.setAttribute("aria-label", `Phát ${track.title}`);
      button.innerHTML = `
        <span class="music-playlist-title">${track.title}</span>
        <span class="music-playlist-artist">${track.artist}</span>
      `;

      button.addEventListener("click", () => {
        loadTrack(index, { autoplay: true });
        setPlaylistOpen(false);
      });

      item.appendChild(button);
      playlistList.appendChild(item);
    });
  }

  function safePlay() {
    music.play().catch((error) => {
      console.log("Music play failed:", error);
      updatePlayState();
    });
  }

  function loadTrack(index, options = {}) {
    const { autoplay = false } = options;
    state.index = (index + tracks.length) % tracks.length;
    music.src = tracks[state.index].src;
    music.load();
    updateTrackMeta();
    renderPlaylist();
    updateTimeline();

    if (autoplay) {
      safePlay();
    } else {
      updatePlayState();
    }
  }

  function getAdjacentTrackIndex(direction) {
    if (!tracks.length) {
      return null;
    }

    if (state.shuffle && tracks.length > 1) {
      let randomIndex = state.index;
      while (randomIndex === state.index) {
        randomIndex = Math.floor(Math.random() * tracks.length);
      }
      return randomIndex;
    }

    const nextIndex = state.index + direction;

    if (nextIndex < 0) {
      return state.repeat ? tracks.length - 1 : null;
    }

    if (nextIndex >= tracks.length) {
      return state.repeat ? 0 : null;
    }

    return nextIndex;
  }

  function goToPreviousTrack() {
    if (music.currentTime > 4) {
      music.currentTime = 0;
      updateTimeline();
      return;
    }

    const previousIndex = getAdjacentTrackIndex(-1);
    if (previousIndex === null) {
      music.currentTime = 0;
      updateTimeline();
      return;
    }

    loadTrack(previousIndex, { autoplay: !music.paused });
  }

  function goToNextTrack() {
    const nextIndex = getAdjacentTrackIndex(1);

    if (nextIndex === null) {
      music.pause();
      music.currentTime = 0;
      updateTimeline();
      return;
    }

    loadTrack(nextIndex, { autoplay: true });
  }

  function togglePlayback() {
    if (music.paused) {
      safePlay();
      return;
    }

    music.pause();
  }

  coverButton.addEventListener("click", togglePlayback);
  playButton.addEventListener("click", togglePlayback);
  prevButton.addEventListener("click", goToPreviousTrack);
  nextButton.addEventListener("click", goToNextTrack);

  shuffleButton.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    updateOptionButtons();
  });

  repeatButton.addEventListener("click", () => {
    state.repeat = !state.repeat;
    updateOptionButtons();
  });

  muteButton.addEventListener("click", () => {
    music.muted = !music.muted;
    updateOptionButtons();
  });

  playlistToggleButton.addEventListener("click", () => {
    setPlaylistOpen(!state.playlistOpen);
  });

  mobileToggleButton.addEventListener("click", () => {
    setMobileCollapsed(!state.mobileCollapsed);
  });

  seekInput.addEventListener("input", () => {
    if (!Number.isFinite(music.duration) || music.duration <= 0) {
      return;
    }

    const nextTime = (Number.parseFloat(seekInput.value) / 100) * music.duration;
    music.currentTime = nextTime;
    updateTimeline();
  });

  music.addEventListener("loadedmetadata", updateTimeline);
  music.addEventListener("durationchange", updateTimeline);
  music.addEventListener("timeupdate", updateTimeline);
  music.addEventListener("play", updatePlayState);
  music.addEventListener("pause", updatePlayState);
  music.addEventListener("volumechange", updateOptionButtons);
  music.addEventListener("ended", goToNextTrack);

  document.addEventListener("click", (event) => {
    if (state.playlistOpen && !card.contains(event.target)) {
      setPlaylistOpen(false);
    }

    if (mobileQuery.matches && !state.mobileCollapsed && !card.contains(event.target)) {
      setMobileCollapsed(true);
    }
  });

  const handleMobileQueryChange = (event) => {
    state.mobileCollapsed = event.matches;
    syncMobilePlayer();
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleMobileQueryChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleMobileQueryChange);
  }

  document.addEventListener(
    "click",
    () => {
      if (music.paused) {
        safePlay();
      }
    },
    { once: true }
  );

  loadTrack(0);
  updateOptionButtons();
  state.mobileCollapsed = mobileQuery.matches;
  syncMobilePlayer(true);
}

function setupStaggeredMenu() {
  const wrapper = document.getElementById("staggered-menu");
  const layer = document.getElementById("staggered-menu-layer");
  const toggle = document.getElementById("sm-toggle");
  const panel = document.getElementById("staggered-menu-panel");
  const backdrop = document.getElementById("sm-backdrop");

  if (!wrapper || !layer || !toggle || !panel || !backdrop) {
    return;
  }

  const menuLinks = layer.querySelectorAll("[data-menu-link]");

  function setMenuState(isOpen) {
    wrapper.classList.toggle("is-open", isOpen);
    layer.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    wrapper.toggleAttribute("data-open", isOpen);
    layer.toggleAttribute("data-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function toggleMenu() {
    setMenuState(!wrapper.classList.contains("is-open"));
  }

  function closeMenu() {
    setMenuState(false);
  }

  toggle.addEventListener("click", toggleMenu);
  backdrop.addEventListener("click", closeMenu);

  menuLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");

      closeMenu();

      if (!targetId || !targetId.startsWith("#")) {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      e.preventDefault();
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && wrapper.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

function initThreeJS() {
  const canvas = document.getElementById("heart-canvas");
  viewerContainer = document.getElementById("heart-container");

  if (!canvas || !viewerContainer) {
    markPageLoaderModelReady();
    return;
  }

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  resizeRendererToViewer();
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xd62839, 0.85);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x8b0000, 0.55, 100);
  pointLight.position.set(-5, 5, 5);
  scene.add(pointLight);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 1.1;
  controls.maxPolarAngle = Math.PI;
  controls.minDistance = 2;
  controls.maxDistance = 18;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO:
      THREE.TOUCH.DOLLY_ROTATE !== undefined
        ? THREE.TOUCH.DOLLY_ROTATE
        : THREE.TOUCH.DOLLY_PAN,
  };

  // Detect user interaction
  controls.addEventListener("start", () => {
    hasManualModelControl = true;
  });

  // Load GLB model
  const loader = new THREE.GLTFLoader();
  loader.load(
    "wrapped_flower_bouquet.glb",
    function (gltf) {
      heartModel = gltf.scene;
      heartModel.scale.set(4, 4, 4);
      heartModel.position.set(0, -1, 0);

      // Keep original materials and colors
      heartModel.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(heartModel);
      fitCameraToModel(heartModel);
      markPageLoaderModelReady();

      // Start animation loop
      animate();
    },
    undefined,
    function (error) {
      console.error("Error loading GLB model:", error);
      markPageLoaderModelReady();
    }
  );

  if (typeof ResizeObserver !== "undefined" && viewerContainer) {
    const resizeObserver = new ResizeObserver(() => {
      resizeRendererToViewer();

      if (heartModel) {
        fitCameraToModel(heartModel);
      }
    });

    resizeObserver.observe(viewerContainer);
  }
}

function resizeRendererToViewer() {
  if (!viewerContainer || !renderer || !camera) {
    return;
  }

  const { width, height } = viewerContainer.getBoundingClientRect();

  if (!width || !height) {
    return;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function fitCameraToModel(model) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const initialCenter = initialBox.getCenter(new THREE.Vector3());

  model.position.sub(initialCenter);
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(
    sphere.radius,
    size.length() / 2,
    Math.max(size.x, size.y, size.z) / 2,
    1
  );

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const safeAspect = Math.max(camera.aspect, 0.75);
  const fitHeightDistance = size.y / (2 * Math.tan(verticalFov / 2));
  const fitWidthDistance =
    size.x / (2 * Math.tan(verticalFov / 2) * safeAspect);
  const fitDepthDistance = size.z * 1.3;
  const distance =
    Math.max(fitHeightDistance, fitWidthDistance, fitDepthDistance) * 1.55;
  const targetY = size.y * 0.02;

  camera.near = Math.max(radius / 60, 0.05);
  camera.far = Math.max(distance * 24, radius * 18, 120);
  camera.position.set(distance * 0.06, size.y * 0.04, distance * 1.06);
  camera.updateProjectionMatrix();

  controls.target.set(0, targetY, 0);
  controls.minDistance = Math.max(radius * 1.7, distance * 0.8, 4.2);
  controls.maxDistance = Math.max(distance * 3.5, controls.minDistance + 6);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);

  if (heartModel) {
    if (!isAnimating && !hasManualModelControl) {
      heartModel.rotation.y += 0.01;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function setupInteractions() {
  const canvas = document.getElementById("heart-canvas");
  const confessionSection = document.getElementById("confession-section");
  if (!canvas || !confessionSection) {
    return;
  }

  const tapThreshold = 8;
  const activePointers = new Set();
  let pointerStart = null;
  let wasDragging = false;
  let isMultiTouchGesture = false;

  function handleHeartInteraction() {
    if (!isAnimating) {
      isAnimating = true;

      // Create explosion effect only
      createHeartExplosion();

      setTimeout(() => {
        confessionSection.classList.add("show");
        document.getElementById("confession-section").scrollIntoView({
          behavior: "smooth",
        });
        isAnimating = false;
      }, 800);
    }
  }

  function resetPointerState() {
    pointerStart = null;
    wasDragging = false;
    isMultiTouchGesture = false;
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

    activePointers.add(e.pointerId);

    if (activePointers.size > 1) {
      wasDragging = true;
      isMultiTouchGesture = true;
      return;
    }

    if (!e.isPrimary) {
      return;
    }

    pointerStart = { x: e.clientX, y: e.clientY };
    wasDragging = false;
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!activePointers.has(e.pointerId)) {
      return;
    }

    if (activePointers.size > 1) {
      wasDragging = true;
      isMultiTouchGesture = true;
      return;
    }

    if (!e.isPrimary || !pointerStart) {
      return;
    }

    const distance = Math.hypot(
      e.clientX - pointerStart.x,
      e.clientY - pointerStart.y
    );

    if (distance > tapThreshold) {
      wasDragging = true;
    }
  });

  canvas.addEventListener("pointerup", function (e) {
    activePointers.delete(e.pointerId);

    if (!e.isPrimary && activePointers.size > 0) {
      return;
    }

    if (
      e.isPrimary &&
      activePointers.size === 0 &&
      pointerStart &&
      !wasDragging &&
      !isMultiTouchGesture
    ) {
      handleHeartInteraction();
    }

    if (activePointers.size === 0) {
      resetPointerState();
    }
  });

  canvas.addEventListener("pointercancel", function (e) {
    activePointers.delete(e.pointerId);

    if (activePointers.size === 0) {
      resetPointerState();
    }
  });

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  // Resize handler
  window.addEventListener("resize", function () {
    resizeRendererToViewer();

    if (heartModel) {
      fitCameraToModel(heartModel);
    }
  });
}

function createHeartExplosion() {
  const explosionContainer = document.getElementById("explosion-container");
  for (let i = 0; i < 12; i++) {
    createSmallHeart(i, explosionContainer);
  }
}

function createSmallHeart(index, container) {
  const heart = document.createElement("div");
  heart.className = "small-heart";
  heart.innerHTML = createRoseIconMarkup("small-heart-icon");
  const angle = (index * 30 * Math.PI) / 180;
  const distance = 200 + Math.random() * 100;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  heart.style.setProperty("--dx", dx + "px");
  heart.style.setProperty("--dy", dy + "px");
  heart.style.left = "50%";
  heart.style.top = "50%";
  container.appendChild(heart);
  setTimeout(() => {
    heart.classList.add("animate");
  }, 100);
  setTimeout(() => {
    heart.remove();
  }, 2100);
}

function createRoseIconMarkup(className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  return `<img src="${ROSE_ICON_PATH}" alt=""${classAttr} draggable="false">`;
}

function setupResponseHandling() {
  const acceptBtn = document.getElementById("accept-btn");
  const declineBtn = document.getElementById("decline-btn");
  const responseSection = document.getElementById("response-section");
  const responseContent = document.getElementById("response-content");

  let declineAttempts = 0;
  let isDeclineDisabled = false;

  // Make accept button glow
  acceptBtn.classList.add("accept-glow");

  acceptBtn.addEventListener("click", function () {
    showResponse("accept");
  });

  acceptBtn.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      showResponse("accept");
    },
    { passive: false }
  );

  // Add hover effects for decline button
  declineBtn.addEventListener("mouseenter", function () {
    if (declineAttempts < 8) {
      const animations = ["decline-dodge", "decline-shrink", "decline-fade"];
      const randomAnimation =
        animations[Math.floor(Math.random() * animations.length)];
      declineBtn.classList.add(randomAnimation);

      setTimeout(() => {
        declineBtn.classList.remove(randomAnimation);
      }, 500);
    }
  });

  function handleDeclineClick(e) {
    declineAttempts++;

    if (declineAttempts <= 8) {
      e.preventDefault();

      // Different reactions based on attempts
      if (declineAttempts === 1) {
        declineBtn.classList.add("decline-shake");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Xem thêm chút nữa nha 🌸';
        setTimeout(() => declineBtn.classList.remove("decline-shake"), 500);
      } else if (declineAttempts === 2) {
        declineBtn.classList.add("decline-fade");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Còn một lời chúc khác đó ✨';
        declineBtn.style.transform = "scale(0.9)";
        setTimeout(() => declineBtn.classList.remove("decline-fade"), 500);
      } else if (declineAttempts === 3) {
        declineBtn.classList.add("decline-shrink");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Sắp tới bất ngờ rồi 💐';
        declineBtn.style.transform = "scale(0.8)";
        declineBtn.style.opacity = "0.7";
        setTimeout(() => declineBtn.classList.remove("decline-shrink"), 300);
      } else if (declineAttempts === 4) {
        declineBtn.classList.add("decline-dodge");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Món quà này hợp 8/3 lắm 🌷';
        declineBtn.style.transform = "scale(0.75)";
        declineBtn.style.opacity = "0.6";
        setTimeout(() => declineBtn.classList.remove("decline-dodge"), 500);
      } else if (declineAttempts === 5) {
        declineBtn.classList.add("decline-shake");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Bấm thêm lần nữa nhé 💝';
        declineBtn.style.transform = "scale(0.7)";
        declineBtn.style.opacity = "0.5";
        setTimeout(() => declineBtn.classList.remove("decline-shake"), 500);
      } else if (declineAttempts === 6) {
        declineBtn.classList.add("decline-fade");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Chuẩn bị mở kỷ niệm rồi 📸';
        declineBtn.style.transform = "scale(0.65)";
        declineBtn.style.opacity = "0.4";
        setTimeout(() => declineBtn.classList.remove("decline-fade"), 500);
      } else if (declineAttempts === 7) {
        declineBtn.classList.add("decline-shrink");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Thêm một chút nữa thôi 🌼';
        declineBtn.style.transform = "scale(0.6)";
        declineBtn.style.opacity = "0.3";
        setTimeout(() => declineBtn.classList.remove("decline-shrink"), 300);
      } else if (declineAttempts === 8) {
        declineBtn.classList.add("decline-dodge");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Mở quà 8/3 luôn nhé 🌟';
        declineBtn.style.transform = "scale(0.55)";
        declineBtn.style.opacity = "0.2";
        setTimeout(() => declineBtn.classList.remove("decline-dodge"), 500);
      }

      // Make accept button more attractive with each attempt
      const glowIntensity = 0.6 + declineAttempts * 0.1;
      const scale = 1.05 + declineAttempts * 0.02;
      acceptBtn.style.transform = `scale(${scale})`;
      acceptBtn.style.boxShadow = `0 0 ${
        20 + declineAttempts * 5
      }px rgba(214, 40, 57, ${glowIntensity})`;

      return false;
    } else {
      // Allow click after 8 attempts
      showResponse("decline");
    }
  }

  declineBtn.addEventListener("click", handleDeclineClick);
  declineBtn.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      handleDeclineClick(e);
    },
    { passive: false }
  );

  function showResponse(type) {
    let content = "";
    if (type === "accept") {
      content = `
        <div class="text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Chúc bạn một ngày 8/3 thật rực rỡ!</h2>
          <p class="text-lg md:text-2xl text-white mb-8 drop-shadow-lg px-4">
            Chúc bạn luôn dịu dàng với chính mình, mạnh mẽ trước mọi thử thách
            và gặp thật nhiều niềm vui trong công việc lẫn cuộc sống. Mong rằng
            mỗi ngày của bạn đều ngập tràn hoa, nụ cười và những điều tử tế.
          </p>
          <button class="glass-button text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium relative z-10" style="background: linear-gradient(135deg, rgba(255, 120, 120, 0.42), rgba(139, 0, 0, 0.42));">
            Viết lời chúc 8/3
          </button>
        </div>
      `;
    } else {
      content = `
        <div class="text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Một bất ngờ nhỏ cho ngày 8/3</h2>
          <p class="text-lg md:text-2xl text-white mb-8 drop-shadow-lg px-4">
            Nếu muốn, mình có thể lưu lại một khoảnh khắc thật xinh cho ngày đặc
            biệt này. Nhấn bên dưới để chụp ảnh kỷ niệm 8/3 nhé!
          </p>
          <button class="glass-button text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium relative z-10" style="background: linear-gradient(135deg, rgba(255, 140, 140, 0.3), rgba(92, 10, 10, 0.42));">
            Mở khung ảnh 8/3
          </button>
        </div>
      `;
    }
    responseContent.innerHTML = content;
    responseSection.classList.remove("opacity-0", "translate-y-10");

    // Add event listener for buttons
    setTimeout(() => {
      const startBtn = responseContent.querySelector(".glass-button");
      if (startBtn) {
        if (type === "accept") {
          startBtn.addEventListener("click", showLoverForm);
        } else {
          startBtn.addEventListener("click", showFriendPhotobooth);
        }
      }
      responseSection.scrollIntoView({
        behavior: "smooth",
      });
    }, 300);
  }
}
function initPhotobooth() {
  const startCameraBtn = document.getElementById("start-camera-btn");
  const takePhotoBtn = document.getElementById("take-photo-btn");
  const retakePhotoBtn = document.getElementById("retake-photo-btn");
  const downloadPhotoBtn = document.getElementById("download-photo-btn");

  if (startCameraBtn) {
    startCameraBtn.addEventListener("click", startFriendCamera);
    startCameraBtn.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        startFriendCamera();
      },
      { passive: false }
    );
  }

  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", takeFriendPhoto);
    takePhotoBtn.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        takeFriendPhoto();
      },
      { passive: false }
    );
  }

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener("click", retakeFriendPhoto);
    retakePhotoBtn.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        retakeFriendPhoto();
      },
      { passive: false }
    );
  }

  if (downloadPhotoBtn) {
    downloadPhotoBtn.addEventListener("click", downloadFriendPhoto);
    downloadPhotoBtn.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        downloadFriendPhoto();
      },
      { passive: false }
    );
  }
}

let friendPhotoData = null;

function startFriendCamera() {
  const video = document.getElementById("camera-video");
  const preview = document.getElementById("photo-preview");
  const startBtn = document.getElementById("start-camera-btn");
  const takeBtn = document.getElementById("take-photo-btn");

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
    .then((mediaStream) => {
      friendStream = mediaStream;
      video.srcObject = mediaStream;
      video.style.display = "block";
      preview.style.display = "none";
      startBtn.style.display = "none";
      takeBtn.style.display = "inline-block";
    })
    .catch((err) => {
      alert("Không thể truy cập camera: " + err.message);
    });
}

function takeFriendPhoto() {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("photo-canvas");
  const preview = document.getElementById("photo-preview");
  const takeBtn = document.getElementById("take-photo-btn");
  const retakeBtn = document.getElementById("retake-photo-btn");
  const downloadBtn = document.getElementById("download-photo-btn");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  friendPhotoData = canvas.toDataURL("image/png");

  video.style.display = "none";
  preview.style.display = "flex";
  preview.innerHTML = `<img src="${friendPhotoData}" alt="Ảnh kỷ niệm 8/3" class="photobooth-media">`;

  takeBtn.style.display = "none";
  retakeBtn.style.display = "inline-block";
  downloadBtn.style.display = "inline-block";

  if (friendStream) {
    friendStream.getTracks().forEach((track) => track.stop());
    friendStream = null;
  }
}

function retakeFriendPhoto() {
  const preview = document.getElementById("photo-preview");
  const startBtn = document.getElementById("start-camera-btn");
  const retakeBtn = document.getElementById("retake-photo-btn");
  const downloadBtn = document.getElementById("download-photo-btn");

  preview.style.display = "flex";
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
    </div>
  `;

  startBtn.style.display = "inline-block";
  retakeBtn.style.display = "none";
  downloadBtn.style.display = "none";
  friendPhotoData = null;
}

function downloadFriendPhoto() {
  if (friendPhotoData) {
    const link = document.createElement("a");
    link.download = `ky-niem-8-3-${
      new Date().toISOString().split("T")[0]
    }.png`;
    link.href = friendPhotoData;
    link.click();
  }
}

function showFriendPhotobooth() {
  const responseContent = document.getElementById("response-content");
  const photobooth = `
    <div class="text-center">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Lưu lại khoảnh khắc 8/3 nhé! 📸</h2>
      <p class="text-lg md:text-xl text-white mb-8 drop-shadow-lg px-4">
        Một bức ảnh xinh xắn để giữ lại niềm vui của ngày Quốc tế Phụ nữ 💐
      </p>
      
      <div class="photobooth-section mb-6">
        <div class="photobooth-frame">
          <video id="camera-video" class="photobooth-media" autoplay playsinline style="display: none;"></video>
          <canvas id="photo-canvas" class="photobooth-media" style="display: none;"></canvas>
          <div id="countdown-overlay" class="countdown-overlay" style="display: none;">
            <div class="countdown-number">3</div>
          </div>
          <div id="photo-preview" class="photo-placeholder">
            <div class="placeholder-content">
              <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
              <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
            </div>
          </div>
        </div>
        
        <div class="photobooth-controls">
          <button id="photo-btn" onclick="startFriendCamera()" class="glass-button-primary">
            <i class="ri-camera-fill"></i>Bật camera
          </button>
        </div>
        
        <div id="photo-reactions" class="photo-reactions" style="display: none;">
          <div class="reactions-list">
            <span class="reaction" onclick="addFriendReaction('🌸')">🌸</span>
            <span class="reaction" onclick="addFriendReaction('💐')">💐</span>
            <span class="reaction" onclick="addFriendReaction('✨')">✨</span>
            <span class="reaction" onclick="addFriendReaction('🌷')">🌷</span>
            <span class="reaction" onclick="addFriendReaction('💖')">💖</span>
            <span class="reaction" onclick="addFriendReaction('🥰')">🥰</span>
          </div>
        </div>
      </div>
    </div>
  `;

  responseContent.innerHTML = photobooth;
}

function showLoverForm() {
  const responseContent = document.getElementById("response-content");
  const formContent = `
    <div class="glass-form-container">
      <div class="glass-notification mb-6">
        <h3 class="text-xl font-bold text-white mb-2">Góc lưu lời chúc 8/3 💐</h3>
        <p class="text-sm text-white opacity-90">Viết vài điều thật đẹp để lưu lại ngày đặc biệt này nhé</p>
      </div>
      
      <form class="glass-form" id="lover-form">
        <div class="form-group">
          <label class="form-label">Tên của bạn</label>
          <input type="text" class="form-input" placeholder="Nhập tên của bạn..." required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Ngày bạn muốn lưu lại</label>
          <input type="date" class="form-input" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Lời nhắn ngày 8/3</label>
          <textarea class="form-input form-textarea" placeholder="Bạn muốn nhắn gửi điều gì trong ngày Quốc tế Phụ nữ?..." rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Điều ước cho chặng đường sắp tới</label>
          <textarea class="form-input form-textarea" placeholder="Một điều bạn mong cho bản thân hoặc người phụ nữ bạn yêu quý..." rows="2" required></textarea>
        </div>
        
        <button type="submit" class="glass-button-submit w-full mt-4">
          <i class="ri-send-plane-fill"></i>
          Lưu lời chúc
        </button>
      </form>
    </div>
  `;

  responseContent.innerHTML = formContent;
  document
    .getElementById("lover-form")
    .addEventListener("submit", handleFormSubmit);
}

// Women's Day message storage
let womensDayData = JSON.parse(localStorage.getItem("womensDayData")) || [];

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // Collect form data
  const data = {
    name: form.querySelector('input[type="text"]').value,
    savedDate: form.querySelector('input[type="date"]').value,
    message: form.querySelector("textarea:first-of-type").value,
    wish: form.querySelector("textarea:last-of-type").value,
    submittedAt: new Date().toLocaleString("vi-VN"),
  };

  // Save to localStorage
  womensDayData.push(data);
  localStorage.setItem("womensDayData", JSON.stringify(womensDayData));

  const responseContent = document.getElementById("response-content");

  const successContent = `
    <div class="text-center">
      <div class="glass-notification success-notification">
        <h3 class="text-2xl font-bold text-white mb-4" style="font-family: 'Camiro', serif;">Đã lưu lời chúc 8/3</h3>
        <p class="text-lg text-white mb-4">
          Cảm ơn bạn đã để lại những lời nhắn thật đẹp. Mong ngày 8/3 của bạn
          luôn ngập tràn hoa, nụ cười và sự trân trọng.
        </p>
        <div class="text-sm text-white opacity-80 mb-6">
          Bạn cũng có thể chụp một tấm ảnh để giữ lại kỷ niệm hôm nay.
        </div>
        
        <div class="photobooth-section mb-6">
          <div class="photobooth-frame">
            <video id="camera-video" class="photobooth-media" autoplay playsinline style="display: none;"></video>
            <canvas id="photo-canvas" class="photobooth-media" style="display: none;"></canvas>
            <div id="countdown-overlay" class="countdown-overlay" style="display: none;">
              <div class="countdown-number">3</div>
            </div>
            <div id="photo-preview" class="photo-placeholder">
              <div class="placeholder-content">
                <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
                <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
              </div>
            </div>
          </div>
          
          <div class="photobooth-controls mt-4">
            <button id="photo-btn" onclick="startCamera()" class="glass-button-primary">
              <i class="ri-camera-fill mr-2"></i>Chụp ảnh lưu niệm
            </button>
          </div>
          
          <div id="photo-reactions" class="photo-reactions" style="display: none;">
            <div class="reactions-list">
              <span class="reaction" onclick="addReaction('🌸')">🌸</span>
              <span class="reaction" onclick="addReaction('💐')">💐</span>
              <span class="reaction" onclick="addReaction('✨')">✨</span>
              <span class="reaction" onclick="addReaction('🌷')">🌷</span>
              <span class="reaction" onclick="addReaction('🥰')">🥰</span>
              <span class="reaction" onclick="addReaction('💖')">💖</span>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button onclick="exportToExcel()" class="glass-button-secondary">
            <i class="ri-file-excel-line mr-2"></i>Xuất lời chúc Excel
          </button>
        </div>
      </div>
    </div>
  `;

  responseContent.innerHTML = successContent;
}

function exportToExcel() {
  if (womensDayData.length === 0) {
    alert("Chưa có lời chúc nào để xuất!");
    return;
  }

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(
    womensDayData.map((item) => ({
      Tên: item.name,
      "Ngày lưu": item.savedDate,
      "Lời nhắn 8/3": item.message,
      "Điều ước": item.wish,
      "Thời gian gửi": item.submittedAt,
    }))
  );

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Loi chuc 8-3");

  // Export file
  XLSX.writeFile(
    wb,
    `loi-chuc-8-3-${new Date().toISOString().split("T")[0]}.xlsx`
  );
}
let stream = null;

function startCamera() {
  const video = document.getElementById("camera-video");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
      video.style.display = "block";
      preview.style.display = "none";

      photoBtn.innerHTML = `
        <div class="flex gap-2">
          <button onclick="startCountdown()" class="glass-button-primary">
            <i class="ri-camera-fill mr-2"></i>Chụp ảnh 8/3
          </button>
          <button onclick="closeCamera()" class="glass-button-secondary">
            <i class="ri-close-line mr-2"></i>Đóng camera
          </button>
        </div>
      `;
    })
    .catch((err) => {
      alert("Không thể truy cập camera: " + err.message);
    });
}

function startCountdown() {
  const countdown = document.getElementById("countdown-overlay");
  const countdownNumber = countdown.querySelector(".countdown-number");
  let count = 3;

  countdown.style.display = "flex";

  const countInterval = setInterval(() => {
    countdownNumber.textContent = count;
    countdownNumber.style.animation = "none";
    setTimeout(() => {
      countdownNumber.style.animation = "countdown-pulse 1s ease-in-out";
    }, 10);

    count--;

    if (count < 0) {
      clearInterval(countInterval);
      countdown.style.display = "none";
      takePhoto();
    }
  }, 1000);
}

function takePhoto() {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("photo-canvas");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Apply skin smoothing filter
  ctx.filter = "blur(0.5px) brightness(1.1) contrast(0.9) saturate(1.1)";
  ctx.drawImage(video, 0, 0);

  // Additional skin smoothing effect
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Soften skin tones (reduce red intensity slightly)
    data[i] = Math.min(255, data[i] * 0.95 + 10); // Red
    data[i + 1] = Math.min(255, data[i + 1] * 0.98 + 5); // Green
    data[i + 2] = Math.min(255, data[i + 2] * 1.02); // Blue
  }

  ctx.putImageData(imageData, 0, 0);
  const photoData = canvas.toDataURL("image/png");

  video.style.display = "none";
  preview.style.display = "flex";
  preview.innerHTML = `
    <img src="${photoData}" alt="Ảnh kỷ niệm 8/3" class="photobooth-media">
  `;

  // Show success notification
  showPhotoSuccess();

  photoBtn.innerHTML = `
    <div class="flex gap-2 justify-center">
      <button onclick="downloadPhoto('${photoData}')" class="glass-button-primary">
        <i class="ri-download-line mr-2"></i>Tải ảnh 8/3
      </button>
      <button onclick="resetCamera()" class="glass-button-secondary">
        <i class="ri-camera-line mr-2"></i>Chụp lại
      </button>
    </div>
  `;

  // Show reactions
  document.getElementById("photo-reactions").style.display = "block";

  stopCamera();
}

function closeCamera() {
  const video = document.getElementById("camera-video");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.style.display = "none";
  preview.style.display = "flex";
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
    </div>
  `;

  photoBtn.innerHTML = `
    <button onclick="startCamera()" class="glass-button-primary">
      <i class="ri-camera-fill mr-2"></i>Chụp ảnh lưu niệm
    </button>
  `;

  document.getElementById("photo-reactions").style.display = "none";
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
}

function resetCamera() {
  const preview = document.getElementById("photo-preview");
  preview.style.display = "flex";
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
    </div>
  `;
  document.getElementById("photo-reactions").style.display = "none";
  stopCamera();
  startCamera();
}

function showPhotoSuccess() {
  const notification = document.createElement("div");
  notification.className = "success-notification";
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(214, 40, 57, 0.92), rgba(92, 10, 10, 0.92));
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  `;
  notification.innerHTML = "📸 Đã lưu ảnh 8/3! 💐";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function addReaction(emoji) {
  const reaction = document.createElement("div");
  reaction.style.cssText = `
    position: fixed;
    font-size: 30px;
    pointer-events: none;
    z-index: 1000;
    animation: reaction-float 2s ease-out forwards;
  `;
  reaction.textContent = emoji;

  const rect = event.target.getBoundingClientRect();
  reaction.style.left = rect.left + "px";
  reaction.style.top = rect.top + "px";

  document.body.appendChild(reaction);

  setTimeout(() => {
    reaction.remove();
  }, 2000);
}

function downloadPhoto(dataUrl) {
  const link = document.createElement("a");
  link.download = `ky-niem-8-3-${new Date().toISOString().split("T")[0]}.png`;
  link.href = dataUrl;
  link.click();
}

let friendStream = null;

function startFriendCamera() {
  const video = document.getElementById("camera-video");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((mediaStream) => {
      friendStream = mediaStream;
      video.srcObject = mediaStream;
      video.style.display = "block";
      preview.style.display = "none";

      photoBtn.innerHTML = `
        <div class="flex gap-2">
          <button onclick="startFriendCountdown()" class="glass-button-primary">
            <i class="ri-camera-fill mr-2"></i>Chụp ảnh 8/3
          </button>
          <button onclick="closeFriendCamera()" class="glass-button-secondary">
            <i class="ri-close-line mr-2"></i>Đóng camera
          </button>
        </div>
      `;
    })
    .catch((err) => {
      alert("Không thể truy cập camera: " + err.message);
    });
}

function startFriendCountdown() {
  const countdown = document.getElementById("countdown-overlay");
  const countdownNumber = countdown.querySelector(".countdown-number");
  let count = 3;

  countdown.style.display = "flex";

  const countInterval = setInterval(() => {
    countdownNumber.textContent = count;
    countdownNumber.style.animation = "none";
    setTimeout(() => {
      countdownNumber.style.animation = "countdown-pulse 1s ease-in-out";
    }, 10);

    count--;

    if (count < 0) {
      clearInterval(countInterval);
      countdown.style.display = "none";
      takeFriendPhoto();
    }
  }, 1000);
}

function takeFriendPhoto() {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("photo-canvas");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const photoData = canvas.toDataURL("image/png");

  video.style.display = "none";
  preview.style.display = "flex";
  preview.innerHTML = `
    <img src="${photoData}" alt="Ảnh kỷ niệm 8/3" class="photobooth-media">
  `;

  showFriendPhotoSuccess();

  photoBtn.innerHTML = `
    <div class="flex gap-2 justify-center">
      <button onclick="downloadFriendPhoto('${photoData}')" class="glass-button-primary">
        <i class="ri-download-line mr-2"></i>Tải ảnh 8/3
      </button>
      <button onclick="resetFriendCamera()" class="glass-button-secondary">
        <i class="ri-camera-line mr-2"></i>Chụp lại
      </button>
    </div>
  `;

  document.getElementById("photo-reactions").style.display = "block";
  stopFriendCamera();
}

function closeFriendCamera() {
  const video = document.getElementById("camera-video");
  const preview = document.getElementById("photo-preview");
  const photoBtn = document.getElementById("photo-btn");

  if (friendStream) {
    friendStream.getTracks().forEach((track) => track.stop());
    friendStream = null;
  }

  video.style.display = "none";
  preview.style.display = "flex";
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
    </div>
  `;

  photoBtn.innerHTML = `
    <button onclick="startFriendCamera()" class="glass-button-primary">
      <i class="ri-camera-fill mr-2"></i>Bật camera
    </button>
  `;

  document.getElementById("photo-reactions").style.display = "none";
}

function stopFriendCamera() {
  if (friendStream) {
    friendStream.getTracks().forEach((track) => track.stop());
    friendStream = null;
  }
}

function resetFriendCamera() {
  const preview = document.getElementById("photo-preview");
  preview.style.display = "flex";
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh lưu niệm 8/3</p>
    </div>
  `;
  document.getElementById("photo-reactions").style.display = "none";
  stopFriendCamera();
  startFriendCamera();
}

function showFriendPhotoSuccess() {
  const notification = document.createElement("div");
  notification.className = "success-notification";
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(255, 90, 95, 0.92), rgba(139, 0, 0, 0.92));
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  `;
  notification.innerHTML = "📸 Đã lưu ảnh 8/3! 🌸";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function addFriendReaction(emoji) {
  const reaction = document.createElement("div");
  reaction.style.cssText = `
    position: fixed;
    font-size: 30px;
    pointer-events: none;
    z-index: 1000;
    animation: reaction-float 2s ease-out forwards;
  `;
  reaction.textContent = emoji;

  const rect = event.target.getBoundingClientRect();
  reaction.style.left = rect.left + "px";
  reaction.style.top = rect.top + "px";

  document.body.appendChild(reaction);

  setTimeout(() => {
    reaction.remove();
  }, 2000);
}

function downloadFriendPhoto(dataUrl) {
  const link = document.createElement("a");
  link.download = `ky-niem-8-3-${new Date().toISOString().split("T")[0]}.png`;
  link.href = dataUrl;
  link.click();
}
