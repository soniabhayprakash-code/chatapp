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

  let localStream;
  let peerConnection;
  let currentCallUser = null;
  let callState = "IDLE";
  let pendingIceCandidates = [];
  let speakerOn = true;

  let callTimerInterval = null;
  let callStartTime = null;

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

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("joinRoom", { roomId });
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

function setCallIcon(state) {

  const callBtn = document.getElementById("voiceCallBtn");
  const endBtn = document.getElementById("endCallBtn");

  if (!callBtn || !endBtn) return;

  if (state === "IDLE") {
    callBtn.style.display = "block";
    endBtn.style.display = "none";
  }

  if (state === "CALLING" || state === "IN_CALL") {
    callBtn.style.display = "none";
    endBtn.style.display = "block";
  }
}





const callBtn = document.getElementById("voiceCallBtn");
const endBtn = document.getElementById("endCallBtn");

callBtn.addEventListener("click", async () => {

  currentCallUser = friendMobile;
  
  playOutgoingRingtone();
  
  callState = "CALLING";
  setCallIcon("CALLING");
  showCallingUI();

  socket.emit("call-user", {
    to: friendMobile,
    from: myMobile
  });

  callBtn.style.display = "none";
  endBtn.style.display = "block";
});


socket.on("call-offer", async ({ offer, from }) => {

  if (callState !== "IN_CALL") return;
  currentCallUser = from;

  peerConnection.onicecandidate = e => {

  if (
    e.candidate &&
    currentCallUser &&
    peerConnection &&
    peerConnection.signalingState !== "closed"
  ) {
    socket.emit("call-ice", {
      to: currentCallUser,
      candidate: e.candidate
    });
  }
 
  };

  peerConnection.ontrack = e => {
    const remoteAudio = document.getElementById("remoteAudio");
    remoteAudio.srcObject = e.streams[0];
    remoteAudio.setAttribute("playsinline", true);
    remoteAudio.play().catch(err => console.log("Play blocked:", err));
  };

  await peerConnection.setRemoteDescription(offer);
  for (const c of pendingIceCandidates) {
  try {
     await peerConnection.addIceCandidate(c);
   } catch (e) {
     console.error("Queued ICE failed:", e);
   }
  }

  pendingIceCandidates = [];

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  for (const c of pendingIceCandidates) {
  try {
     await peerConnection.addIceCandidate(c);
   } catch (e) {
     console.error("Queued ICE failed:", e);
   }
  }

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
    remoteAudio.setAttribute("playsinline", true);
    remoteAudio.play().catch(err => console.log("Play blocked:", err));
  };

  peerConnection.onicecandidate = e => {

  if (
    e.candidate &&
    currentCallUser &&
    peerConnection &&
    peerConnection.signalingState !== "closed"
  ) {
    socket.emit("call-ice", {
      to: currentCallUser,
      candidate: e.candidate
    });
  }

  };


}

socket.on("incoming-call", ({ from, name }) => {
  currentCallUser = from;
  callState = "RINGING";
  setCallIcon("RINGING");
  showIncomingCallUI(name);

   playIncomingRingtone();
  
});

const outgoingTone = document.getElementById("outgoingTone");
const incomingTone = document.getElementById("incomingTone");

function playOutgoingRingtone() {
  outgoingTone.volume = 0.5;
  outgoingTone.play().catch(()=>{});
}

function stopOutgoingRingtone() {
  outgoingTone.pause();
  outgoingTone.currentTime = 0;
}

function playIncomingRingtone() {
  incomingTone.volume = 0.8;
  incomingTone.play().catch(()=>{});
}

function stopIncomingRingtone() {
  incomingTone.pause();
  incomingTone.currentTime = 0;
}

socket.on("call-answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
  for (const c of pendingIceCandidates) {
  try {
     await peerConnection.addIceCandidate(c);
   } catch (e) {
     console.error("Queued ICE failed:", e);
   }
  }
  pendingIceCandidates = [];
  callState = "IN_CALL";
  setCallIcon("IN_CALL");

});


socket.on("call-accepted", async () => {
  stopOutgoingRingtone();
  removeCallingUI();

  await getAudioStream();
  await createPeer();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  for (const c of pendingIceCandidates) {
  try {
     await peerConnection.addIceCandidate(c);
   } catch (e) {
     console.error("Queued ICE failed:", e);
   }
  }

pendingIceCandidates = [];

  if (window.AndroidAudio) {
     window.AndroidAudio.setSpeaker(true);
  }
  speakerOn = true;


  socket.emit("call-offer", {
    to: currentCallUser,
    from: myMobile,
    offer
  });

});


socket.on("call-ice", async ({ candidate }) => {

  if (!peerConnection) return;

  if (
    peerConnection.signalingState === "closed" ||
    !peerConnection.remoteDescription
  ) {
    console.warn("⚠ ICE queued — peer not ready");
    pendingIceCandidates.push(candidate);
    return;
  }

  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (err) {
    console.error("ICE add error:", err);
  }
});


endBtn.addEventListener("click", () => {
  removeCallingUI2();
  peerConnection?.close();
  localStream?.getTracks().forEach(t => t.stop());

  socket.emit("call-end", {
    to: currentCallUser
  });

  pendingIceCandidates = [];
  callState = "IDLE";
  setCallIcon("IDLE");

  endBtn.style.display = "none";
  callBtn.style.display = "block";
});

socket.on("call-end", () => {

  callState = "IDLE";
  setCallIcon("IDLE");

  stopIncomingRingtone();
  stopOutgoingRingtone();
  stopCallTimer();

  removeCallingUI();
  removeCallingUI1();
  removeCallingUI2();

  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.close();
    peerConnection = null;
  }

  localStream?.getTracks().forEach(t => t.stop());
  localStream = null;

  pendingIceCandidates = [];

  console.log("Call Cleaned");

  showAlert("Call Ended");
  speakerOn = true;

  if (window.AndroidAudio) {
    window.AndroidAudio.setSpeaker(true);
  }
});


function showIncomingCallUI(name) {

  let box = document.getElementById("incomingCallBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "incomingCallBox";

    box.innerHTML = `
      <p>📞 ${name} is calling...</p>
      <button id="acceptCallBtn">Accept</button>
      <button id="rejectCallBtn">Reject</button>
    `;


    document.body.appendChild(box);

    document.getElementById("acceptCallBtn").onclick = async () => {
      
      stopIncomingRingtone();
      showCallingrunUI() 
      
      callState = "IN_CALL";
      setCallIcon("IN_CALL");
      box.remove();
      socket.emit("accept-call", { to: currentCallUser });
      await getAudioStream();
      await createPeer();
     
     if (window.AndroidAudio) {
        window.AndroidAudio.setSpeaker(true);
     }
     speakerOn = true;

    };

    document.getElementById("rejectCallBtn").onclick = () => {
      
      stopIncomingRingtone();
      
      box.remove();
      socket.emit("call-end", { to: currentCallUser });
    };
  }
}

function showCallingUI() {

  let box = document.getElementById("callingBox");

  if (box) return;

  box = document.createElement("div");
  box.id = "callingBox";

  box.innerHTML = `
      <p>📞 Calling to Friend...</p>
      <button id="cancelCallBtn">Cancel</button>
  `;

  document.body.appendChild(box);

  document.getElementById("cancelCallBtn").onclick = () => {
    
    stopOutgoingRingtone();
    
    socket.emit("call-end", { to: currentCallUser });
    removeCallingUI();
    removeCallingUI2();
    setCallIcon("IDLE"); 
  };
}

function removeCallingUI() {
  document.getElementById("callingBox")?.remove();
  showCallingrunUI();
}

function removeCallingUI1() {
  document.getElementById("incomingCallBox")?.remove();
}


  function showCallingrunUI() {

  let box = document.getElementById("callrunBox");

  if (box) return;

  box = document.createElement("div");
  box.id = "callrunBox";

  box.innerHTML = `
      <p>📞 00:00:00 </p>
       <button id="micToggleBtn">🎤</button>
      <button id="speakerToggleBtn">🔊</button>
  `;

  document.body.appendChild(box);

    startCallTimer();

  document.getElementById("speakerToggleBtn").onclick = () => {

  const speakerBtn = document.getElementById("speakerToggleBtn");

  if (speakerOn) {
    if (window.AndroidAudio) {
      window.AndroidAudio.setSpeaker(false);
    }

    speakerBtn.textContent = "🎧";
    speakerOn = false;
    console.log("🔈 Ear speaker ON");

  } else {
    if (window.AndroidAudio) {
      window.AndroidAudio.setSpeaker(true);
    }

    speakerBtn.textContent = "🔊";
    speakerOn = true;
    console.log("🔊 Loud speaker ON");
  }

};

    let micMuted = false;

document.getElementById("micToggleBtn").onclick = () => {
  const micBtn = document.getElementById("micToggleBtn");

  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];

  if (!audioTrack) return;

  if (!micMuted) {
    audioTrack.enabled = false;
    micBtn.textContent = "🔇";
    micMuted = true;
    console.log("🎙 Mic muted");
  } else {
    audioTrack.enabled = true;
    micBtn.textContent = "🎤";
    micMuted = false;
    console.log("🎙 Mic unmuted");
  }
};

}

  function removeCallingUI2() {
  document.getElementById("callrunBox")?.remove();
}

  function startCallTimer() {

  callStartTime = Date.now();

  callTimerInterval = setInterval(() => {

    const elapsed = Date.now() - callStartTime;

    const totalSeconds = Math.floor(elapsed / 1000);

    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    const timeText = `${hours}:${minutes}:${seconds}`;

    const timeEl = document.querySelector("#callrunBox p");

    if (timeEl) {
      timeEl.innerText = `📞 ${timeText}`;
    }

  }, 1000);
}


function stopCallTimer() {

  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }

  callStartTime = null;
}



  

//   const speakerBtn = document.getElementById("speakerToggleBtn");

// speakerBtn.addEventListener("click", () => {

//   speakerOn = !speakerOn;

//   if (window.AndroidAudio) {
//     window.AndroidAudio.setSpeaker(speakerOn);
//   }

//   speakerBtn.innerText = speakerOn
//     ? "🔊 Speaker"
//     : "🎧 Earpiece";
// });

  


});

















































