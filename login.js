document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://chattingplatform.onrender.com";
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "🐵";
  }
});

async function login() {
  const mobile = document.getElementById("mobile").value.trim();
  const password = passwordInput.value.trim();

  if (!mobile || !password) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
      "Content-Type": "application/json"
    },
      body: JSON.stringify({ mobile, password })
    });

    const data = await res.json();

    if (data.success && data.otpRequired) {
      localStorage.setItem("mobile", mobile);
      await fetch(`${API_BASE}/auth/send-otp`, {
          method: "POST",
          headers: {
      "Content-Type": "application/json"
    },
            body: JSON.stringify({ mobile })
       });
      window.location.href = "otp.html";
    } 
    else if (data.success && !data.otpRequired) {
      localStorage.setItem("mobile", mobile);
      window.location.href = "profile.html"; 
    } 
    else {
      alert(data.message);
    }

  } catch (err) {
    alert("--Server error--");
    console.error(err);
  }
}
});

