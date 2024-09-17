document.addEventListener("DOMContentLoaded", () => {
  const audioFileInput = document.getElementById("audioFileInput");
  const transcriptBtn = document.getElementById("transcriptBtn");
  const recordAudioBtn = document.getElementById("recordAudioBtn");
  const stopRecordingBtn = document.getElementById("stopRecordingBtn");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const statusMessage = document.getElementById("statusMessage");
  const reloadPageBtn = document.getElementById("reloadPageBtn");
  const addTranscriptBtn = document.getElementById("add-transcript-btn");
  const transcriptsContainer = document.getElementById("transcripts");
  const abbrievationsContainer = document.getElementById("abbs");
  const submitBtn = document.getElementById("submit-btn");
  const abbrievationInput = document.getElementById("abb-input");
  const abbrievationMeaning = document.getElementById("abb-meaning");
  const clearAllAbbrievations = document.getElementById("clear-all-btn");

  let abbrievationStorage = []; // stores abbreviations
  let mediaRecorder;
  let recordedChunks = [];
  let isRecording = false;
  let currentTranscriptBox = null;

  addTranscript();

  // add new transcript box
  function addTranscript() {
    const transcript = document.createElement("div");
    transcript.classList.add("transcript-container");

    const wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");

    const serialNum = document.createElement("p");
    serialNum.classList.add("serial-num");

    const textBox = document.createElement("textarea");
    textBox.classList.add("transcript-output");
    textBox.rows = "10";
    textBox.cols = "100";
    textBox.disabled = true;

    const transcriptBtns = document.createElement("div");
    transcriptBtns.classList.add("transcript-btns");

    const editTranscriptBtn = document.createElement("button");
    const copyTranscriptBtn = document.createElement("button");
    const clearTranscriptBtn = document.createElement("button");
    editTranscriptBtn.classList.add("transcript-btn");
    copyTranscriptBtn.classList.add("transcript-btn");
    clearTranscriptBtn.classList.add("transcript-btn");

    const doneBtn = document.createElement("button");
    doneBtn.style.backgroundColor = "#ccc";

    const editDescText = document.createElement("span");
    const copyDescText = document.createElement("span");
    const clearDescText = document.createElement("span");
    editDescText.textContent = "Edit the output transcription";
    copyDescText.textContent = "Copy the output transcript to clipboard";
    clearDescText.textContent = "Clear the current transcript box";
    editDescText.classList.add("desc-text");
    copyDescText.classList.add("desc-text");
    clearDescText.classList.add("desc-text");

    editTranscriptBtn.textContent = "Edit Transcript";
    copyTranscriptBtn.textContent = "Copy Transcript";
    clearTranscriptBtn.textContent = "Clear Transcript";
    doneBtn.textContent = "Done";
    doneBtn.style.display = "none";

    editTranscriptBtn.disabled = true;
    copyTranscriptBtn.disabled = true;

    editTranscriptBtn.disabled = true;
    copyTranscriptBtn.disabled = true;
    clearTranscriptBtn.disabled = false;

    editTranscriptBtn.addEventListener("click", () => {
      textBox.disabled = false;
      doneBtn.style.display = "inline-block";
      editTranscriptBtn.disabled = true;
    });

    copyTranscriptBtn.addEventListener("click", () => {
      textBox.disabled = false;
      textBox.select();
      navigator.clipboard.writeText(textBox.value);
      textBox.disabled = true;
      statusMessage.textContent = "Transcript copied to clipboard!";
    });

    doneBtn.addEventListener("click", () => {
      textBox.disabled = true;
      doneBtn.style.display = "none";
      editTranscriptBtn.disabled = false;
    });

    clearTranscriptBtn.addEventListener("click", () => {
      transcriptsContainer.removeChild(transcript);
      updateSerialNumbers();
    });

    transcriptBtns.appendChild(editTranscriptBtn);
    transcriptBtns.appendChild(copyTranscriptBtn);
    transcriptBtns.appendChild(clearTranscriptBtn);
    transcriptBtns.appendChild(doneBtn);

    editTranscriptBtn.appendChild(editDescText);
    copyTranscriptBtn.appendChild(copyDescText);
    clearTranscriptBtn.appendChild(clearDescText);

    wrapper.appendChild(textBox);
    wrapper.appendChild(transcriptBtns);
    transcript.appendChild(serialNum);
    transcript.appendChild(wrapper);

    transcriptsContainer.insertBefore(
      transcript,
      transcriptsContainer.firstChild
    );

    currentTranscriptBox = textBox;

    updateSerialNumbers();
  }

  // serial number feature
  function updateSerialNumbers() {
    const transcripts = transcriptsContainer.querySelectorAll(
      ".transcript-container"
    );
    const totalTranscripts = transcripts.length;
    transcripts.forEach((transcript, index) => {
      const serialNum = transcript.querySelector(".serial-num");
      serialNum.textContent = `${totalTranscripts - index}.`;
    });
  }

  // handles errors 
  function handleError(error) {
    if (currentTranscriptBox) {
      currentTranscriptBox.value = `Error: ${error.message}`;
    }
    statusMessage.textContent = `Error: ${error.message}`;
    // window.location.reload();
    toggleButtons(true, true, false);
  }

  // toggle speech button
  function toggleButtons(transcriptEnabled, recordEnabled, stopEnabled) {
    transcriptBtn.disabled = !transcriptEnabled;
    recordAudioBtn.disabled = !recordEnabled;
    stopRecordingBtn.disabled = !stopEnabled;
  }

  // create new abbreviation
  function createAbbrievation(abb, meaning) {
    const abbrievation = document.createElement("div");
    abbrievation.classList.add("abb-item");

    const abbrievationBox = document.createElement("div");
    abbrievationBox.classList.add("abb-box");
    const abbrievationShort = document.createElement("input");
    const abbrievationMeans = document.createElement("input");
    abbrievationShort.disabled = true;
    abbrievationMeans.disabled = true;
    abbrievationShort.value = abb;
    abbrievationMeans.value = meaning;

    // implies symbol
    const symbol = document.createElement("span");
    symbol.classList.add('arrow-symbol');
    symbol.classList.add("material-symbols-outlined");
    symbol.textContent = "arrow_forward";
    symbol.style.fontSize = "20px";

    // btns container
    const utilBox = document.createElement("div");
    utilBox.classList.add("util-box");

    // remove btn
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Delete";
    removeBtn.classList.add("remove-btn");
    removeBtn.addEventListener("click", () => removeAbbrievation(abbrievation));
    // edit btn
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";

    const abbreviationObject = abbrievationStorage.find(
      (abbObj) => abbObj.name === abb
    );

    editBtn.addEventListener("click", () => {
      editAbbrievation(
        abbrievationShort,
        abbrievationMeans,
        editBtn,
        abbreviationObject
      );
    });

    // appending ops
    abbrievationBox.appendChild(abbrievationShort);
    abbrievationBox.appendChild(symbol);
    abbrievationBox.appendChild(abbrievationMeans);

    utilBox.appendChild(editBtn);
    utilBox.appendChild(removeBtn);

    abbrievation.appendChild(abbrievationBox);
    abbrievation.appendChild(utilBox);

    abbrievationsContainer.appendChild(abbrievation);
  }

  // convert words from transcript into abbreviations
  function replaceAbbreviations(transcript) {
    abbrievationStorage.forEach(({ name, meaning }) => {
      const regex = new RegExp(`\\b${name}\\b`, "gi");
      transcript = transcript.replace(regex, meaning);
    });
    return transcript;
  }

  // remove single abbreviation
  function removeAbbrievation(abbrievationElement) {
    abbrievationElement.remove();
  }

  // edit abbreviation 
  function editAbbrievation(
    abbrievationShortElem,
    abbrievationMeansElem,
    editBtnElem,
    abbreviationObject
  ) {
    if (editBtnElem.textContent === "Edit") {
      abbrievationShortElem.disabled = false;
      abbrievationMeansElem.disabled = false;
      abbrievationShortElem.focus();
      editBtnElem.textContent = "Save";
    } else {
      console.log("Entered else");

      abbrievationShortElem.disabled = true;
      abbrievationMeansElem.disabled = true;
      editBtnElem.textContent = "Edit";

      abbreviationObject.name = abbrievationShortElem.value;
      abbreviationObject.meaning = abbrievationMeansElem.value;

      console.log("Update Abbreviation: ", abbreviationObject)
    }
  }

  // uploading audio
  async function uploadAudio(audioBlob) {
    const formData = new FormData();
    formData.append("files", audioBlob);

    const loadingSpinner = document.getElementById("spinner");
    loadingSpinner.style.display = "block";

    statusMessage.textContent =
      "Please wait, we are transcribing your audio note. Transcription time depends on the length of the audio.";

    try {
      const response = await fetch("https://49.50.119.73.nip.io/whisper", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        let transcript = result.results[0].transcript;

        transcript = replaceAbbreviations(transcript);

        if (currentTranscriptBox) {
          currentTranscriptBox.value = transcript;
          const transcriptContainer = currentTranscriptBox.parentNode;
          const editTranscriptBtn =
            transcriptContainer.querySelector("button:first-child");
          const copyTranscriptBtn = transcriptContainer.querySelector(
            "button:nth-child(2)"
          );
          editTranscriptBtn.disabled = false;
          copyTranscriptBtn.disabled = false;
        }

        statusMessage.textContent = "Transcription complete!";
        toggleButtons(true, true, false);

        audioFileInput.value = "";
        fileNameDisplay.textContent = "No file chosen";
      } else {
        handleError(new Error(response.statusText));
      }
    } catch (error) {
      handleError(error);
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  // abbreviation form submit
  function handleFormSubmit(e) {
    e.preventDefault();

    abbrievationInput.style.border = "2px solid #295f00";
    abbrievationMeaning.style.border = "2px solid #295f00";

    if (abbrievationInput.value == null || abbrievationInput.value == "") {
      abbrievationInput.style.border = "2px solid red";
      return;
    }
    if (abbrievationMeaning.value == null || abbrievationMeaning.value == "") {
      abbrievationMeaning.style.border = "2px solid red";
      return;
    }

    // console.log(abbrievationInput.value, ":", abbrievationMeaning.value);
    abbrievationStorage.push({
      name: abbrievationInput.value,
      meaning: abbrievationMeaning.value,
    });
    createAbbrievation(abbrievationInput.value, abbrievationMeaning.value);

    abbrievationInput.value = "";
    abbrievationMeaning.value = "";
    console.log(abbrievationStorage);
  }

  // File upload handling
  audioFileInput.addEventListener("change", () => {
    const fileName =
      audioFileInput.files.length > 0
        ? audioFileInput.files[0].name
        : "No file chosen";
    fileNameDisplay.textContent = fileName;
    toggleButtons(!!audioFileInput.files.length, true, false);
  });

  transcriptBtn.addEventListener("click", async () => {
    if (audioFileInput.files.length > 0) {
      statusMessage.textContent =
        "Please wait, we are transcribing your audio note. Transcription time depends on the length of the audio.";
      toggleButtons(false, false, false);
      await uploadAudio(audioFileInput.files[0]);
    }
  });

  // Audio recording handling
  recordAudioBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) =>
        recordedChunks.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
        recordedChunks = []; // Reset for next recording
        await uploadAudio(audioBlob);
        isRecording = false;
        toggleButtons(true, true, false);
      };

      mediaRecorder.start();
      isRecording = true;
      statusMessage.textContent = "Recording... Please start speaking.";
      toggleButtons(false, false, true);
    } catch (error) {
      handleError(error);
    }
  });

  stopRecordingBtn.addEventListener("click", () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      stopRecordingBtn.disabled = true;
      statusMessage.textContent =
        "Please wait, we are transcribing your audio note. Transcription time depends on the length of the audio.";
    }
  });

  // Page reload
  reloadPageBtn.addEventListener("click", () => {
    window.location.reload();
  });

  addTranscriptBtn.addEventListener("click", () => {
    addTranscript();
  });

  submitBtn.addEventListener("click", handleFormSubmit);

  clearAllAbbrievations.addEventListener("click", (e) => {
    e.preventDefault();
    abbrievationStorage = [];
    while (abbrievationsContainer.firstChild) {
      abbrievationsContainer.removeChild(abbrievationsContainer.lastChild);
    }
  });
});
