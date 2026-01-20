function showAlert(message) {
  document.getElementById("alertMessage").textContent = message;
  document.getElementById("customAlert").classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}
document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://chatapp-1-suv6.onrender.com";

  const nameEl = document.getElementById("name");
  const mobileEl = document.getElementById("mobile");
  const friendsBox = document.getElementById("friendsList");
  const addFriendBtn = document.getElementById("addFriendBtn");

  const mobile = localStorage.getItem("myMobile");

  if (!mobile) {
    showAlert("User not logged in");
    window.location.href = "index.html";
    return;
  }

  const socket = io(BASE_URL);

  socket.on("connect", () => {
    console.log("Socket connected");
    socket.emit("register-user", mobile);
  });

  socket.on("friend-added", (data) => {
    console.log("Friend added in real-time:", data);
    loadFriends(); 
  });

  window.addEventListener("beforeunload", () => {
    socket.disconnect();
  });

  async function loadProfile() {
    try {
      const res = await fetch(
        `${BASE_URL}/auth/profile?mobile=${mobile}`
      );

      const data = await res.json();
      console.log("PROFILE DATA:", data);

      if (!data.success) {
        showAlert(data.message);
        return;
      }

      nameEl.textContent = data.user.name;

      const m = data.user.mobile;
      mobileEl.textContent = m.slice(0, 2) + "******" + m.slice(-2);

    } catch (err) {
      console.error("Profile error:", err);
    }
  }

  async function loadFriends() {
    try {
      const res = await fetch(
        `${BASE_URL}/auth/friends?mobile=${mobile}`
      );

      const data = await res.json();
      friendsBox.innerHTML = "";

      if (!data.success || data.friends.length === 0) {
        friendsBox.innerHTML = "<p>No friends added yet.</p>";
        return;
      }

      data.friends.forEach(friend => {
        const div = document.createElement("div");
        div.className = "friend-card";

        div.innerHTML = `
          <b>Name:</b> ${friend.name}<br>
          <b>Mobile:</b> ******${friend.mobile.slice(-2)}
        `;

        div.onclick = () => {
          localStorage.setItem("chatFriendName", friend.name);
          localStorage.setItem("chatFriendMobile", friend.mobile);
          window.location.href = "chat.html";
        };
        friendsBox.appendChild(div);
      });

    } catch (err) {
      console.error("Friends error:", err);
    }
  }

  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", () => {
      window.location.href = "addfriend.html";
    });
  }

  const finishBtn = document.getElementById("finishBtn");

  if (finishBtn) {
    finishBtn.addEventListener("click", async () => {

      // const confirmDelete = confirm(
      //   "Are you sure? Your account will be permanently deleted."
      // );

      // if (!confirmDelete) return;

      try {
        const res = await fetch("${BASE_URL}/auth/delete-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mobile: mobile
          })
        });

        const data = await res.json();

        if (!data.success) {
          showAlert(data.message);
          return;
        }

        localStorage.clear();

        showAlert("Account deleted successfully.");

        window.location.href = "index.html";

      } catch (err) {
        console.error(err);
        showAlert("--Server error--");
      }
    });
  }

  loadProfile();
  loadFriends();
});



