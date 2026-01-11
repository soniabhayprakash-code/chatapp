document.addEventListener("DOMContentLoaded", () => {

  const myMobile = localStorage.getItem("mobile");
  const chatFriend = JSON.parse(localStorage.getItem("chatFriend"));

  if (!myMobile || !chatFriend) {
    alert("Chat session invalid");
    window.location.href = "profile.html";
    return;
  }

  const friendNameEl = document.getElementById("friendName");
  if (friendNameEl) {
    friendNameEl.textContent = chatFriend.name;
  }

  const socket = io("https://chattingplatform.onrender.com", {
    transports: ["websocket"]
  });
  socket.emit("join", myMobile);
  socket.on("connect", () => {
  socket.emit("join", myMobile);
  });

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("messageInput");
  const messagesList = document.getElementById("messages");
  const chatBox = document.getElementById("chat-box");
  const typing = document.getElementById("typing");

  function scrollToBottom() {
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
  }

  function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function addMessage(text, type) {
    const li = document.createElement("li");
    li.classList.add(type);

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const msgText = document.createElement("span");
    msgText.className = "msg-text";
    msgText.textContent = text;

    const timestamp = document.createElement("span");
    timestamp.className = "timestamp";
    timestamp.textContent = getTime();

    bubble.appendChild(msgText);
    bubble.appendChild(timestamp);
    li.appendChild(bubble);
    messagesList.appendChild(li);

    scrollToBottom();
  }

  function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    addMessage(text, "sent");

    socket.emit("chat message", {
      from: myMobile,
      to: chatFriend.mobile,
      text: text
    });

    input.value = "";
    input.style.height = "52px";
    input.style.overflowY = "hidden";
  }

  socket.on("chat message", (data) => {
    if (
      data &&
      data.from === chatFriend.mobile &&
      data.to === myMobile
    ) {
      addMessage(data.text, "received");
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "52px";

    if (input.scrollHeight > 52) {
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
      input.style.overflowY = "auto";
    } else {
      input.style.overflowY = "hidden";
    }
  });

  input.addEventListener("focus", () => {
    setTimeout(() => {
      typing.scrollIntoView({ behavior: "smooth", block: "nearest" });
      scrollToBottom();
    }, 300);
  });

  if ("virtualKeyboard" in navigator) {
    navigator.virtualKeyboard.overlaysContent = true;

    navigator.virtualKeyboard.addEventListener("geometrychange", (event) => {
      const keyboardHeight = event.target.boundingRect.height;
      typing.style.bottom = keyboardHeight + "px";
      scrollToBottom();
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/chattingplatform/service-worker.js")
        .then(reg => {
          console.log("Service Worker Registered");
          reg.update();
        })
        .catch(err => console.log("SW error", err));
    });
  }

});
