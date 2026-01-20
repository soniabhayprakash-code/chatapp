function showAlert(message) {
  document.getElementById("alertMessage").textContent = message;
  document.getElementById("customAlert").classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}

async function addFriend() {
  const BASE_URL = "https://chatapp-1-suv6.onrender.com";
  const friendMobileInput = document.getElementById("addfriend");
  const friendMobile = friendMobileInput.value.trim();

  const myMobile = localStorage.getItem("myMobile");


  if (!myMobile) {
    showAlert("User not logged in");
    window.location.href = "index.html";
    return;
  }

  if (!friendMobile) {
    showAlert("Please enter mobile number.");
    return;
  }

  if (!/^\d{10}$/.test(friendMobile)) {
    showAlert("Enter valid 10 digit mobile number.");
    return;
  }

  if (friendMobile === myMobile) {
    showAlert("You cannot add yourself.");
    return;
  }

  try {
    const res = await fetch("${BASE_URL}/auth/add-friend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        myMobile: myMobile,
        friendMobile: friendMobile
      })
    });

    const data = await res.json();
    console.log("ADD FRIEND RESPONSE:", data);

    if (!data.success) {
      showAlert(data.message);
      return;
    }

    showAlert("Friend added successfully.");

    window.location.href = "profile.html";

  } catch (err) {
    console.error("Add friend error:", err);
    showAlert("--Server error--");
  }
}



