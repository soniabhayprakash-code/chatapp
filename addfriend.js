async function addFriend() {
  const friendMobileInput = document.getElementById("addfriend");
  const friendMobile = friendMobileInput.value.trim();

  const myMobile = localStorage.getItem("myMobile");


  if (!myMobile) {
    alert("User not logged in");
    window.location.href = "index.html";
    return;
  }

  if (!friendMobile) {
    alert("Please enter mobile number.");
    return;
  }

  if (!/^\d{10}$/.test(friendMobile)) {
    alert("Enter valid 10 digit mobile number.");
    return;
  }

  if (friendMobile === myMobile) {
    alert("You cannot add yourself.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/auth/add-friend", {
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
      alert(data.message);
      return;
    }

    alert("Friend added successfully.");

    window.location.href = "profile.html";

  } catch (err) {
    console.error("Add friend error:", err);
    alert("--Server error--");
  }
}
