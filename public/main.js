const socket = io("http://192.168.0.37:7000");

notificationSound = document.getElementById("notification");
document.addEventListener("visibilitychange", onchange);

socket.on("connect", function () {
  appendChat({
    id: "0",
    from: "system",
    message: "Caution: The bot likes to make up stuff.",
  });
});

socket.on("message", function (data) {
  if (document.hidden) {
    notificationSound.play();
  }

  const messageLoadingElement = document.getElementById("loading-message");
  if (messageLoadingElement) {
    messageLoadingElement.remove();
  }

  appendChat(data);
});

socket.on("character", function (data) {
  document.getElementById("overlay").innerText = `${data.name} ${data.surname}`;
  document.getElementById("age").innerText = data.age;
  document.getElementById("sex").innerText = data.sex;
  document.getElementById("birthplace").innerText = data.birthplace;
  document.getElementById("ethnicity").innerText = data.ethnicity;
  document.getElementById("occupation").innerText = data.occupation;
  document.getElementById("summary-data").innerText = data.summary;
});

socket.on("image", function (data) {
  document.getElementById("loader").style.display = "none";
  document.getElementById("img").src = data;
});

socket.on("loading-message", function (data) {
  // Chat
  const chatElement = document.getElementById("content");

  // Message Container
  const messageContainerElement = document.createElement("div");
  messageContainerElement.className = "message-container";
  messageContainerElement.id = "loading-message";

  // Message Element
  const messageElement = document.createElement("div");
  messageElement.className = `message bot`;

  // Message Content Element
  const messageContentElement = document.createElement("div");
  messageContentElement.className = "content";

  // Message Loading Element
  const messageLoadingElement = document.createElement("div");
  messageLoadingElement.className = "dot-flashing";

  messageContentElement.appendChild(messageLoadingElement);
  messageElement.appendChild(messageContentElement);
  messageContainerElement.appendChild(messageElement);
  chatElement.appendChild(messageContainerElement);
});

socket.on("tts", function (data) {
  const { filename, id } = data;

  const messageElement = document.getElementById(id);

  const audioContainer = document.createElement("div");
  audioContainer.className = "audio-container";

  const audioElement = document.createElement("audio");
  audioElement.id = id + "-audio";

  const sourceElement = document.createElement("source");
  sourceElement.src = filename;
  sourceElement.type = "audio/mpeg";

  audioElement.appendChild(sourceElement);

  const audioButton = document.createElement("i");
  audioButton.className = "material-symbols-outlined audio-button";
  audioButton.textContent = "play_circle";

  audioContainer.appendChild(audioElement);
  messageElement.appendChild(audioContainer);

  audioElement.addEventListener("loadedmetadata", function () {
    audioButton.addEventListener("click", function () {
      if (audioElement.paused) {
        audioElement
          .play()
          .then(() => {
            console.log("playing");
            audioButton.textContent = "pause_circle";
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
          });
      } else {
        audioElement.pause();
        console.log("paused");
        audioButton.textContent = "play_circle";
      }
    });
  });

  audioElement.addEventListener("error", function (event) {
    console.error("Audio playback error:", event);
  });

  messageElement.appendChild(audioElement);
  messageElement.appendChild(audioButton);
});

document.getElementById("send").onclick = function () {
  var message = document.getElementById("message-input").value;

  if (message.trim().length > 0) {
    socket.emit("message", { from: "user", message: message });
    appendChat({ from: "user", message: message });
    document.getElementById("message-input").value = "";
  }
};

document
  .getElementById("message-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();

    if (event.key === "Enter") {
      document.getElementById("send").click();
    }
  });

function appendChat(data) {
  const from = data.from;
  const id = data.id;
  const message = data.message;

  // Chat
  const chatElement = document.getElementById("content");

  // Message Container
  const messageContainerElement = document.createElement("div");
  messageContainerElement.className = "message-container";
  messageContainerElement.id = id;

  // Message Element
  const messageElement = document.createElement("div");
  messageElement.className = `message ${from}`;

  // Message Content Element
  const messageContentElement = document.createElement("div");
  messageContentElement.className = "content";
  messageContentElement.textContent = getMessage(message, from);

  // Timestamp
  const timestampElement = document.createElement("div");
  timestampElement.textContent = new Date().toLocaleTimeString("pt-BR", {
    hour12: false,
    hour: "numeric",
    minute: "numeric",
  });
  timestampElement.className = "timestamp";

  // Icon
  const iconElement = document.createElement("span");
  iconElement.className = "material-symbols-outlined";
  iconElement.textContent = "exclamation";

  // Appending elements
  messageElement.appendChild(messageContentElement);
  messageContainerElement.appendChild(messageElement);

  switch (from) {
    case "user":
      messageElement.appendChild(timestampElement);
      break;
    case "system":
      messageContentElement.insertBefore(
        iconElement,
        messageContentElement.firstChild,
      );
      break;
    default:
      messageElement.appendChild(timestampElement);
      break;
  }

  chatElement.appendChild(messageContainerElement);
  chatElement.scrollTop = chatElement.scrollHeight;
}

function getMessage(message, name) {
  if (message.includes(`${name}:`)) {
    return message.split(`${name}:`)[1];
  } else {
    return message;
  }
}
