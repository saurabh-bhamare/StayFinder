(() => {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
})();


// TOGGLE CHAT
function toggleChat() {
  const box = document.getElementById("chatBox");
  box.style.display = box.style.display === "none" ? "flex" : "none";
}

// SEND MESSAGE
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBody = document.getElementById("chatBody");

  const message = input.value.trim();
  if (!message) return;

  chatBody.innerHTML += `<div class="msg user-msg">${message}</div>`;
  input.value = "";

  chatBody.innerHTML += `<div class="msg bot-msg" id="typing">Typing...</div>`;

  const res = await fetch("/ai-help", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  document.getElementById("typing").remove();

  chatBody.innerHTML += `<div class="msg bot-msg">${data.reply}</div>`;

  speak(data.reply); // 🔊 voice

  chatBody.scrollTop = chatBody.scrollHeight;
}

let isListening = false;

function startListening() {
  const micBtn = document.getElementById("micBtn");
  const userInput = document.getElementById("userInput");

  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Your browser doesn't support voice input. Try Chrome.");
    return;
  }

  if (isListening) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  isListening = true;
  micBtn.style.borderColor = "#ff385c";
  micBtn.style.color = "#ff385c";

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    userInput.focus();
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
    if (event.error === "not-allowed") {
      alert("Microphone access denied. Please allow mic permissions in your browser.");
    }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.style.borderColor = "";
    micBtn.style.color = "";
  };
}