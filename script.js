document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://chatapp-6rfl.onrender.com";

  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const registerBtn = document.getElementById("registerbtn");

  togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      togglePassword.textContent = "🐵";
    }
  });

  async function register() {
    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const passwordEl = document.getElementById("password");
    const password = passwordEl ? passwordEl.value.trim() : "";

    // const password = passwordInput.value.trim();

    if (!name || !mobile || !password) {
      alert("Please fill all fields.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      alert("Enter valid 10 digit mobile number.");
      return;
    }

    registerBtn.disabled = true;

    try {
      const res = await fetch("${BASE_URL}/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.clear();          
        localStorage.setItem("myMobile", mobile);
        alert(data.message);
        window.location.href = "profile.html";
      } else {
        alert(data.message);
        registerBtn.disabled = false;
      }

    } catch (err) {
      console.error(err);
      alert("--Server error--");
      registerBtn.disabled = false;
    }
  }

  registerBtn.addEventListener("click", register);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch(err => console.log("SW error", err));
  }

});

