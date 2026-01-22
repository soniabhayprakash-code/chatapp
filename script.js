function showAlert(message) {
    document.getElementById("alertMessage").textContent = message;
    document.getElementById("customAlert").classList.remove("hidden");
}

function closeAlert() {
    document.getElementById("customAlert").classList.add("hidden");
}
document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://chatapp-1-suv6.onrender.com";

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
      showAlert("Please fill all fields.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      showAlert("Enter valid 10 digit mobile number.");
      return;
    }

    registerBtn.disabled = true;

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.clear();          
        localStorage.setItem("myMobile", mobile);
        showAlert(data.message);
        window.location.href = "profile.html";
      } else {
        showAlert(data.message);
        registerBtn.disabled = false;
      }

    } catch (err) {
      console.error(err);
      showAlert("--Server error--");
      registerBtn.disabled = false;
    }
  }

  registerBtn.addEventListener("click", register);

  if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
        .then((registration) => {
               console.log("Service Worker Registered");

               registration.update();
      })
      .catch(err => console.log("SW error", err));
     });
     }
     navigator.serviceWorker.getRegistrations().then(regs => {
          console.log("SW registrations:", regs);
     });

});









