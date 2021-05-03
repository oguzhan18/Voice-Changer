var recognition = new webkitSpeechRecognition();
var synth = window.speechSynthesis;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;

var synth = window.speechSynthesis;

const voiceList = document.querySelector(".voices");
const list = document.querySelector(".said");
const area = document.querySelector("[data-type]");
const btn = document.querySelector("[data-start]");
const stop = document.querySelector("[data-stop]");
const say = document.querySelector("[data-say]");

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const speechGaps = [
  "um...",
  "um...",
  "uhh...",
  "uh...",
  "uhh..",
  "uhh...",
  "uh...",
  "umm...",
  "uh...",
  "umm...",
];

function getSpeechGap() {
  return speechGaps[getRandomInt(0, speechGaps.length)];
}

function saySomething(words) {
  var utterThis = new SpeechSynthesisUtterance(words || getSpeechGap());
  utterThis.voice = voice;
  utterThis.pitch = getRandomArbitrary(0.5, 1.25);
  utterThis.rate = getRandomArbitrary(1.2, 1.5);
  utterThis.volume = getRandomArbitrary(0.75, 1);
  synth.speak(utterThis); 
}

say.addEventListener("click", () => {
  var text = area.value;
  saySomething(text); 
});

setTimeout(() => {
  recognition.start();
}, 1000);

btn.addEventListener("click", () => {
  recognition.start();
})

stop.addEventListener("click", () => {
  recognition.stop();
});

let voice = null;
let isTalking = false;

function toSeconds(ms) {
  return Math.floor((ms % (1000 * 60)) / 1000)
}

let currLine = null;
let lastWords = null;

function handleResult(result, allResults) {
  if (currLine == null) {
    currLine = document.createElement("li");
    currLine.textContent = ``;
    list.prepend(currLine);
    lastWords = new Date();
  }
  
  const { transcript: text, confidence } = result[0];
    
  if (!result.isFinal) {
    if (currLine.textContent.length === 0 || (new Date() - lastWords > 700)) {
      saySomething();
    }
    
    console.log(new Date() - lastWords)
    
    currLine.textContent = []
      .slice
      .apply(allResults)
      .filter((x) => !x.isFinal)
      .map((x) => x[0])
      .map((x) => x.transcript)
      .join(" ")
    
    lastWords = new Date();
    return;
  }

  const didSay = confidence > 0.7;
  const toCancel = text.includes("cancel");
  const saysSwitch = text.includes("switch voice");
  
  const theText = toBrokenEnglish(text);
  
  var utterThis = new SpeechSynthesisUtterance(`${theText}`);
  utterThis.voice = voice;
  utterThis.pitch = getRandomArbitrary(0.5, 1.25);
  utterThis.rate = getRandomArbitrary(1, 1.25);

  currLine.textContent = `${theText} (${confidence})`;
  currLine.className = toCancel ? "cancel" : didSay ? "yep" : "nope";
  
  utterThis.onend = function() {
    isTalking = false;
  };
  
  if (saysSwitch) {
    const total = text.toLowerCase().replace("switch voice", "");
    const voices = speechSynthesis.getVoices();
    voice = voices.find((x) => x.name.toLowerCase().includes(total));
  } else if (didSay && !toCancel) {
    synth.speak(utterThis);
    isTalking = true;
  }  
  
  currLine = null;
}

function getWords(word) {
  if (/[*]/g.test(word)) {
    return word;
  }
  
  return {
  }[word] || word;
}

function toBrokenEnglish(text) {
  function getPause() {
    const pauses = ["uh", "um", "ah", "m"];
    return pauses[getRandomInt(0, pauses.length)];
  }
  
  const words = text.split(" ");
  
  return words.reduce((all, word, index) => {
    const rand = getRandomInt(0, 10) == 4;
    const isLast = index === (words.length - 1);
    const extractWord = getWords(word.toLowerCase());
    
    return all + ` ${extractWord} `
  }, "");
}

recognition.onresult = function(event) {
  const lastResult = event.results[event.results.length - 1];
  handleResult(lastResult, event.results);
}


speechSynthesis.onvoiceschanged = (v) => {
  const voices = speechSynthesis.getVoices();
  
  voiceList.innerHTML = voices
    .map((voice) => voice.name)
    .map((name) => `
      <li class="voice-select">
          <button class="voicer">${name}</button>
      </li>  
    `)
    .join("")
  
  voice = voices.find((x) => x.name.includes("UK English Male"));
  
  document.querySelectorAll(".voicer").forEach((item) => {
    item.addEventListener("click", (evt) => {
      const voiceName = evt.target.innerText;
      const matched = voices.find((x) => x.name == voiceName);
      voice = matched;
      
      clearVoiceButtons();
      evt.target.className = "voicer selected-voice";
    });
  });
  
  function clearVoiceButtons() {
    document.querySelectorAll(".voicer").forEach((item) => {
      item.className = "voicer";
    });
  }
};

recognition.onerror = function(event) {
  console.log(event); 
  setTimeout(() => {
    recognition.start();
  }, 10000);
}

recognition.addEventListener("audiostart", (evt) => {
 console.log("audio started...", evt);
});

recognition.addEventListener("audioend", (evt) => {
  console.log("audio ended...", evt);
});

recognition.addEventListener("end", (evt) => {
  console.log("disconnected...", evt);
  setTimeout(() => {
    recognition.stop();
    recognition.start();
  }, 10000);
});

recognition.addEventListener("nomatch", (evt) => {
  console.log("cant see shit...", evt);
});

recognition.addEventListener("result", (evt) => {
  console.log("got a match...", evt);
});

recognition.addEventListener("start", (evt) => { 
 console.log("we started...", evt);
});