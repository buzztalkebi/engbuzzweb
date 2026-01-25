// -------------------------------------
// CONFIG
// -------------------------------------
const API_BASE = "https://buzztalk-gateway.logustrancy.workers.dev";

// -------------------------------------
// LOAD PHOTOS
// -------------------------------------
async function loadPhotos() {
  const uidInput = document.getElementById("uid");
  const uid = uidInput.value.trim();

  if (!uid) {
    alert("Please enter your Unique ID");
    return;
  }

  const loading = document.getElementById("loading");
  const gallery = document.getElementById("gallery");

  gallery.innerHTML = "";
  loading.classList.remove("hidden");

  try {
    const response = await fetch(
      `${API_BASE}/photos?uid=${encodeURIComponent(uid)}`
    );

    if (!response.ok) throw new Error("Fetch failed");

    const data = await response.json();
    loading.classList.add("hidden");

    if (!data.photos || data.photos.length === 0) {
      gallery.innerHTML = "<p style='text-align:center'>No photos found.</p>";
      return;
    }

    renderGallery(data.photos);

  } catch (error) {
    loading.classList.add("hidden");
    gallery.innerHTML = "<p style='text-align:center;color:red'>Error loading photos.</p>";
  }
}

// -------------------------------------
// RENDER GALLERY
// -------------------------------------
function renderGallery(photoUrls) {
  const gallery = document.getElementById("gallery");
  photoUrls.forEach((url, index) => {
    const div = document.createElement("div");
    div.className = "photo";
    const fileName = `Buzztalk_Event_${index + 1}.jpg`;

    div.innerHTML = `
      <img src="${url}" loading="lazy" alt="Event photo">
      <a href="${url}" download="${fileName}" target="_blank">⬇ Download</a>
    `;
    gallery.appendChild(div);
  });
}

// -------------------------------------
// AUTO LOAD ID FROM URL
// -------------------------------------
(function autoFill() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    document.getElementById("uid").value = id;
    loadPhotos();
  }
})();

// -------------------------------------
// QR SCANNER (DESKTOP + MOBILE FIX)
// -------------------------------------
let html5QrCode = null;
let allCameras = [];
let cameraIndex = 0;
let isScanning = false;

async function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // 1. ZOMBIE KILLER (Windows Fix)
  if (window.stream) {
    try { window.stream.getTracks().forEach(track => track.stop()); } catch(e){}
  }
  
  // 2. Clear old instance
  if (html5QrCode) {
    try { await html5QrCode.clear(); } catch(e) {}
    html5QrCode = null;
  }

  // 3. Start fresh with delay
  setTimeout(initScanner, 300);
}

function initScanner() {
  html5QrCode = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      allCameras = devices;
      // Default to back camera
      let backCamIndex = devices.findIndex(d => d.label.toLowerCase().includes("back"));
      if (backCamIndex === -1) backCamIndex = devices.length - 1;
      cameraIndex = backCamIndex;
      startCamera(allCameras[cameraIndex].id);
    } else {
      alert("No cameras found.");
      forceCloseQR();
    }
  }).catch(err => {
    handleError(err);
  });
}

function startCamera(cameraId) {
  if (isScanning) return;
  isScanning = true;

  html5QrCode.start(
    cameraId,
    {
      fps: 15,    // Faster scanning
      // qrbox REMOVED: This allows scanning the WHOLE frame.
      // Critical for Windows/Brave where resolution/crop mismatches occur.
      videoConstraints: {
        focusMode: "continuous", // Ask for autofocus
        facingMode: "environment"
      }
    },
    (decodedText) => {
      // Success
      forceCloseQR();
      const cleanText = decodedText.trim();
      document.getElementById("uid").value = cleanText;
      loadPhotos();
    },
    (errorMessage) => {
      // Ignore scan errors
    }
  ).then(() => {
    // Started
  }).catch(err => {
    isScanning = false;
    handleError(err);
  });
}

function switchCamera() {
  if (!allCameras || allCameras.length < 2) {
    alert("Only one camera detected!");
    return;
  }
  if (!html5QrCode) return;

  html5QrCode.stop().then(() => {
    isScanning = false;
    cameraIndex = (cameraIndex + 1) % allCameras.length;
    startCamera(allCameras[cameraIndex].id);
  }).catch(err => {
    console.error("Flip failed", err);
    isScanning = false;
    // Try forcing restart
    html5QrCode.clear().then(() => startCamera(allCameras[cameraIndex].id));
  });
}

function handleError(err) {
  isScanning = false;
  console.error("Camera Error:", err);
  
  if (err.name === "NotReadableError") {
    alert("Camera busy. Close other apps/tabs.");
  } else if (err.name === "NotAllowedError") {
    alert("Permission denied.");
  } else {
    alert("Error: " + err.name);
  }
  forceCloseQR();
}

function forceCloseQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  isScanning = false;

  if (html5QrCode) {
    try {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
      }).catch(() => {
        html5QrCode.clear();
      });
    } catch (e) {}
  }
}

// Global exposure
window.switchCamera = switchCamera;
window.forceCloseQR = forceCloseQR;
