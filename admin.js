const ADMIN_PASSWORD = "buzztalkebi987";

if (!sessionStorage.getItem("admin")) {
  const pwd = prompt("Enter admin password:");
  if (pwd !== ADMIN_PASSWORD) {
    alert("Access denied");
    document.body.innerHTML = "";
  } else {
    sessionStorage.setItem("admin", "yes");
  }
}
// -------------------------------------
// CONFIG
// -------------------------------------

const API_BASE =
  "https://buzztalk-gateway.logustrancy.workers.dev";

// -------------------------------------
// UPLOAD FUNCTION
// -------------------------------------

async function uploadPhoto() {
  const uid = document.getElementById("uid").value.trim();
  const file = document.getElementById("photo").files[0];
  const status = document.getElementById("status");

  if (!uid) {
    alert("Please enter a Unique ID");
    return;
  }

  if (!file) {
    alert("Please select a photo");
    return;
  }

  status.innerText = "⏳ Uploading photo...";

  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(
      `${API_BASE}/upload?uid=${encodeURIComponent(uid)}`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (data.success) {
      status.innerText = "✅ Photo uploaded successfully";
      document.getElementById("photo").value = "";
    } else {
      status.innerText = "❌ Upload failed";
    }

  } catch (err) {
    console.error(err);
    status.innerText = "❌ Error uploading photo";
  }
}
