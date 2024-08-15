document.addEventListener("DOMContentLoaded", () => {
  const audioFileInput = document.getElementById("audioFileInput");
  const transcriptBtn = document.getElementById("transcriptBtn");
  const recordAudioBtn = document.getElementById("recordAudioBtn");
  const stopRecordingBtn = document.getElementById("stopRecordingBtn");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const statusMessage = document.getElementById("statusMessage");
  const transcriptOutput = document.getElementById("transcriptOutput");
  const editTranscriptBtn = document.getElementById("editTranscriptBtn");
  const copyTranscriptBtn = document.getElementById("copyTranscriptBtn");
  const reloadPageBtn = document.getElementById("reloadPageBtn");

  let mediaRecorder;
  let recordedChunks = [];
  let isRecording = false;

  function handleError(error) {
    transcriptOutput.value = `Error: ${error.message}`;
    statusMessage.textContent = "";
    window.location.reload();
    toggleButtons(true, true, false, false, false);
  }

  function toggleButtons(
    transcriptEnabled,
    recordEnabled,
    stopEnabled,
    editEnabled,
    copyEnabled
  ) {
    transcriptBtn.disabled = !transcriptEnabled;
    recordAudioBtn.disabled = !recordEnabled;
    stopRecordingBtn.disabled = !stopEnabled;
    editTranscriptBtn.disabled = !editEnabled;
    copyTranscriptBtn.disabled = !copyEnabled;
  }

  async function uploadAudio(audioBlob) {
    const formData = new FormData();
    formData.append("files", audioBlob);

    transcriptOutput.value = "";

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
        transcriptOutput.value = transcript;
        statusMessage.textContent = "Transcription complete!";
        toggleButtons(true, true, false, true, true);
      } else {
        handleError(new Error(response.statusText));
      }
    } catch (error) {
      handleError(error);
    }
  }

  // File upload handling
  audioFileInput.addEventListener("change", () => {
    const fileName =
      audioFileInput.files.length > 0
        ? audioFileInput.files[0].name
        : "No file chosen";
    fileNameDisplay.textContent = fileName;
    toggleButtons(!!audioFileInput.files.length, true, false, false, false);
  });

  transcriptBtn.addEventListener("click", async () => {
    if (audioFileInput.files.length > 0) {
      statusMessage.textContent =
        "Please wait, we are transcribing your audio note. Transcription time depends on the length of the audio.";
      toggleButtons(false, false, false, false, false);
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
        toggleButtons(true, true, false, true, true);
      };

      mediaRecorder.start();
      isRecording = true;
      statusMessage.textContent = "Recording... Please start speaking.";
      toggleButtons(false, false, true, false, false);
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

  // Transcript editing and copying
  editTranscriptBtn.addEventListener("click", () => {
    transcriptOutput.disabled = false;
    editTranscriptBtn.disabled = true;
    copyTranscriptBtn.disabled = false;
  });

  copyTranscriptBtn.addEventListener("click", () => {
    const transcriptText = transcriptOutput.value;

    // Temporary enable textarea to select the content
    transcriptOutput.disabled = false;
    transcriptOutput.select();

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(transcriptText)
        .then(() => {
          statusMessage.textContent = "Transcript copied to clipboard!";
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    } else {
      // Fallback for non-secure context
      if (document.execCommand("copy")) {
        alert("Transcript copied to clipboard!");
      } else {
        alert("Failed to copy the transcript.");
      }
    }

    // Re-disable the textarea after copying
    transcriptOutput.disabled = true;
  });

  // Page reload
  reloadPageBtn.addEventListener("click", () => {
    window.location.reload();
  });
});
