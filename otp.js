async function otp() {
  const otp = document.getElementById("otp").value.trim();
  const mobile = localStorage.getItem("mobile");

  if (!otp) {
    alert("Please enter OTP");
    return;
  }

  if (!mobile) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mobile, otp })
    });

    const data = await res.json();

    if (data.success) {
      alert("OTP verified successfully");
      localStorage.setItem("mobile", mobile);
      window.location.href = "profile.html";
    } else {
      alert(data.message);
    }

  } catch (err) {
    alert("--Server error--");
    console.error(err);
  }
}
