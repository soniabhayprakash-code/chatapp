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

async function register() {
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const password = passwordInput.value.trim();

  if (!name || !mobile || !password) {
    alert("Please fill all fields.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, mobile, password })
    });

    const data = await res.json();

    if (data.success) {
      alert("Registration successful. Please login.");
      window.location.href = "login.html";
    } else {
      alert(data.message);
    }

  } catch (err) {
    alert("--Server error--");
    console.error(err);
  }
}





