function showAlert(message) {
  document.getElementById("alertMessage").textContent = message;
  document.getElementById("customAlert").classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://chatapp-1-suv6.onrender.com";

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("messageInput");
  const messagesList = document.getElementById("messages");
  const chatBox = document.getElementById("chat-box");
  const typing = document.getElementById("typing");
  const typingIndicator = document.getElementById("typingIndicator");

  let localStream = null;
  let peerConnection = null;
  let currentCallUser = null;

  let typingTimeout;
  let isTyping = false;

  const myMobile = localStorage.getItem("myMobile");
  const friendMobile = localStorage.getItem("chatFriendMobile");

  if (!myMobile || !friendMobile) {
    showAlert("Chat user not found.");
    window.location.href = "profile.html";
    return;
  }

  const friendName = document.getElementById("friendName");  
  const friendNameValue = localStorage.getItem("chatFriendName");

  if (friendName && friendNameValue) {
    friendName.textContent = friendNameValue;
}

  const socket = io(BASE_URL, {
    transports: ["websocket"]
  });

  const roomId = [myMobile, friendMobile].sort().join("_");

  let pushSubscribed = false;
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("joinRoom", { roomId });
    if (!pushSubscribed) {
      subscribeUser();
      pushSubscribed = true;
    }
    socket.emit("register-user", myMobile);
  });

  socket.on("roomJoined", (data) => {
    console.log("Joined room:", data.roomId);
  });

  socket.on("reconnect", () => {
    console.log("Socket reconnected");
    socket.emit("joinRoom", { roomId });
  });

  function scrollToBottom() {
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
  }
  
  socket.on("loadMessages", (messages) => {

    messages.forEach(msg => {

      if (msg.sender === myMobile) {
        addMessage(msg.message, "sent");
      } else {
        addMessage(msg.message, "received");
      }

   });

  });

  if ('virtualKeyboard' in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;

        navigator.virtualKeyboard.addEventListener('geometrychange', (event) => {
            const keyboardHeight = event.target.boundingRect.height;
            typing.style.bottom = keyboardHeight + "px";
            scrollToBottom();
        });
    }

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function addMessage(text, type) {
    const li = document.createElement("li");
    li.classList.add(type);

    const messageBubble = document.createElement("div");
    messageBubble.className = "bubble";

    const msgText = document.createElement("span");
    msgText.className = "msg-text";
    msgText.textContent = text;

    const timestamp = document.createElement("span");
    timestamp.className = "timestamp";
    timestamp.textContent = getTime();

    messageBubble.appendChild(msgText);
    messageBubble.appendChild(timestamp);
    li.appendChild(messageBubble);

    messagesList.appendChild(li);
    scrollToBottom();
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "sent");

    socket.emit("sendMessage", {
      roomId,
      message: text,
      sender: myMobile
    });

    input.value = "";
    input.style.height = "52px";
    input.style.overflowY = "hidden";
  }
  socket.on("receiveMessage", (data) => {
    if (data.roomId !== roomId) return;
    if (data.sender === myMobile) return;

    addMessage(data.message, "received");
  });
  sendBtn.addEventListener("click", sendMessage);
  sendBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      sendMessage();
  });

   input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
        input.style.height = "52px";
    }
    });

    input.addEventListener('focus', () => {
        setTimeout(() => {
            typing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            scrollToBottom();
        }, 400);
    });

    input.addEventListener("input", () => {
    input.style.height = "52px"; 

    if (input.scrollHeight > 52) {
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
        input.style.overflowY = "auto";
    } else {
        input.style.overflowY = "hidden";
    }
    if (!input.value.trim()) return;

    if (!isTyping) {
      socket.emit("typing", {
      roomId,
      mobile: myMobile
    });
      isTyping = true;
    }

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        socket.emit("stopTyping", { roomId });
        isTyping = false;
      }, 1200);
    });

  socket.on("showTyping", () => {
      typingIndicator.textContent = `is typing...`;
      typingIndicator.classList.remove("hidden");
    });


  socket.on("hideTyping", () => {
      typingIndicator.classList.add("hidden");
    });

  typingIndicator.classList.add("hidden");
  window.addEventListener("beforeunload", () => {
    socket.disconnect();
  });

  async function askNotificationPermission() {
  const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("Notification allowed");
      } else {
        console.log("Notification denied");
      }
  }
  if (Notification.permission !== "granted") {
    askNotificationPermission();
  }

  function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
  }

  async function subscribeUser() {

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    console.log("ℹ Already subscribed.");
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      "BNUrv6TmdB7Z86Z3677UxvZS5QEhZ89DlT4nS91fU76XND0sKSOWCtKjcvljmGugh331XQtVBYOMhXxdVt_vkWE"
    )
  });

  await fetch("/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...sub.toJSON(),
      mobile: myMobile
    })
  });
}

 const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

async function getAudioStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  return localStream;
}



const callBtn = document.getElementById("voiceCallBtn");
const endBtn = document.getElementById("endCallBtn");

callBtn.addEventListener("click", async () => {

  currentCallUser = friendMobile;

  await getAudioStream();
  await createPeer();

  socket.emit("call-user", {
    to: friendMobile,
    from: myMobile
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("call-offer", {
    to: friendMobile,
    from: myMobile,
    name: localStorage.getItem("myName"),
    offer
  });

  callBtn.style.display = "none";
  endBtn.style.display = "block";
});

  socket.on("incoming-call", ({ from, name }) => {
  currentCallUser = from;
  showIncomingCallUI(name);
});


socket.on("call-answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on("call-ice", async ({ candidate }) => {
  if (candidate && peerConnection) {
    await peerConnection.addIceCandidate(candidate);
  }
});

socket.on("call-offer", async ({ offer, from }) => {

  currentCallUser = from;

  await getAudioStream();

  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = e => {
  if (e.candidate && currentCallUser) {
    socket.emit("call-ice", {
      to: currentCallUser,
      candidate: e.candidate
    });
   }
  };


  peerConnection.ontrack = e => {
    const remoteAudio = document.getElementById("remoteAudio");
    remoteAudio.srcObject = e.streams[0];
    remoteAudio.play().catch(err => console.log("Play blocked:", err));
  };

  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("call-answer", {
    to: currentCallUser,
    from: myMobile,
    answer
  });

});

async function createPeer() {

  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = e => {
    const remoteAudio = document.getElementById("remoteAudio");
    remoteAudio.srcObject = e.streams[0];
    remoteAudio.play().catch(err => console.log("Play blocked:", err));
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate && currentCallUser) {
      socket.emit("call-ice", {
        to: currentCallUser,
        candidate: e.candidate
      });
    }
  };

}

// socket.on("incoming-call", ({ from, name }) => {
//   currentCallUser = from;
//   showIncomingCallUI(name);
// });


// socket.on("call-answer", async ({ answer }) => {
//   await peerConnection.setRemoteDescription(answer);
// });

// socket.on("call-ice", async ({ candidate }) => {
//   if (candidate && peerConnection) {
//     await peerConnection.addIceCandidate(candidate);
//   }
// });

endBtn.addEventListener("click", () => {
  peerConnection?.close();
  localStream?.getTracks().forEach(t => t.stop());

  socket.emit("call-end", {
    to: currentCallUser
  });

  endBtn.style.display = "none";
  callBtn.style.display = "block";
});

socket.on("call-end", () => {
  peerConnection?.close();
  alert("Call ended");
});

function showIncomingCallUI(name) {

  let box = document.getElementById("incomingCallBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "incomingCallBox";

    box.style.position = "fixed";
    box.style.top = "20px";
    box.style.left = "50%";
    box.style.transform = "translateX(-50%)";
    box.style.background = "black";
    box.style.color = "white";
    box.style.padding = "15px 25px";
    box.style.borderRadius = "20px";
    box.style.zIndex = "9999";

    box.innerHTML = `
      📞 <b>${name}</b> is calling...
      <br><br>
      <button id="acceptCallBtn">Accept</button>
      <button id="rejectCallBtn">Reject</button>
    `;

    document.body.appendChild(box);

    document.getElementById("acceptCallBtn").onclick = () => {
      box.remove();
      socket.emit("call-answer", { to: currentCallUser });
    };

    document.getElementById("rejectCallBtn").onclick = () => {
      box.remove();
      socket.emit("call-end", { to: currentCallUser });
    };
  }
}

  
});

















