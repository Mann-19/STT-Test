document.addEventListener("DOMContentLoaded", () => {
  const audioFileInput = document.getElementById("audioFileInput");
  const transcriptBtn = document.getElementById("transcriptBtn");
  const recordAudioBtn = document.getElementById("recordAudioBtn");
  const stopRecordingBtn = document.getElementById("stopRecordingBtn");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const statusMessage = document.getElementById("statusMessage");
  const transcriptOutput = document.getElementById("transcriptOutput");
  const reloadPageBtn = document.getElementById("reloadPageBtn");
  const addTranscriptBtn = document.getElementById("add-transcript-btn");
  const transcriptsContainer = document.getElementById("transcripts");

  let mediaRecorder;
  let recordedChunks = [];
  let isRecording = false;
  let currentTranscriptBox = null;

  function addTranscript() {
    const transcript = document.createElement("div");
    transcript.classList.add("transcript-container");

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
      // document.execCommand("copy");
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
    });

    transcriptBtns.appendChild(editTranscriptBtn);
    transcriptBtns.appendChild(copyTranscriptBtn);
    transcriptBtns.appendChild(clearTranscriptBtn);
    transcriptBtns.appendChild(doneBtn);

    editTranscriptBtn.appendChild(editDescText);
    copyTranscriptBtn.appendChild(copyDescText);
    clearTranscriptBtn.appendChild(clearDescText);

    transcript.appendChild(textBox);
    transcript.appendChild(transcriptBtns);

    // transcriptsContainer.appendChild(transcript);
    transcriptsContainer.insertBefore(transcript, transcriptsContainer.firstChild);

    // transcript.scrollIntoView({ behavior: "smooth" });

    currentTranscriptBox = textBox;
  }

  function handleError(error) {
    if (currentTranscriptBox) {
      currentTranscriptBox.value = `Error: ${error.message}`;
    }
    window.location.reload();
    toggleButtons(true, true, false);
  }

  function toggleButtons(transcriptEnabled, recordEnabled, stopEnabled) {
    transcriptBtn.disabled = !transcriptEnabled;
    recordAudioBtn.disabled = !recordEnabled;
    stopRecordingBtn.disabled = !stopEnabled;
  }

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
        const transcript = result.results[0].transcript;

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

  addTranscriptBtn.addEventListener("click", addTranscript);
});
