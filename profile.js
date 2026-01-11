document.addEventListener("DOMContentLoaded", () => {

  const nameEl = document.getElementById("name");
  const mobileEl = document.getElementById("mobile");
  const friendsBox = document.getElementById("friendsList");

  const mobile = localStorage.getItem("mobile");

  if (!mobile) {
    alert("User not logged in");
    window.location.href = "login.html";
    return;
  }

  const socket = io("https://chattingplatform.onrender.com", {
    transports: ["websocket"]
  });
  socket.emit("join", mobile);

  socket.on("connect", () => {
    socket.emit("join", mobile);
  });

  socket.on("friend-added", () => {
    loadFriends();
  });

  async function loadProfile() {
    try {
      const res = await fetch(
        `http://localhost:3000/auth/profile?mobile=${mobile}`
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      if (nameEl) {
          nameEl.textContent = data.user.name;
      }

      if (mobileEl) {
          const m = data.user.mobile;
          mobileEl.textContent =
          m.slice(0, 2) + "******" + m.slice(-2);
      }


    } catch (err) {
      console.error(err);
      alert("--Server error--");
    }
  }

  async function addFriend() {
    const friendMobile = prompt("Enter friend's mobile number");
    if (!friendMobile) return;

    try {
      const res = await fetch("http://localhost:3000/auth/add-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myMobile: mobile,
          friendMobile
        })
      });

      const data = await res.json();
      alert(data.message);

      if (data.success) {
        loadFriends(); 
      }

    } catch (err) {
      alert("--Server error--");
    }
  }
  window.addFriend = addFriend;
  async function loadFriends() {
    try {
      const res = await fetch(
        `http://localhost:3000/auth/friends?mobile=${mobile}`
      );

      const data = await res.json();

      friendsBox.innerHTML = "";

      if (!data.success || data.friends.length === 0) {
        friendsBox.innerHTML = "<p>No friends added yet</p>";
        return;
      }

      data.friends.forEach(friend => {
        const div = document.createElement("div");
        div.className = "friend-card";
        div.innerHTML = `
        <b>Name:</b> ${friend.name}<br>
        <b>Mobile:</b> ${friend.mobile}
     `;

       div.onclick = () => {
          localStorage.setItem(
                "chatFriend",
                  JSON.stringify({
                  name: friend.name,
                  mobile: friend.mobile
    })
  );

  window.location.href = "chat.html";
};

        friendsBox.appendChild(div);
      });

    } catch (err) {
      console.error(err);
    }
  }

  loadProfile();
  loadFriends();
});

