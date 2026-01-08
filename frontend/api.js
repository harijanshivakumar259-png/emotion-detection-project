async function sendAudioToBackend(blob) {
  const form = new FormData();
  form.append("audio", blob, "clip.webm");

  // Correct endpoint
  const res = await fetch("http://localhost:5000/api/emotion/detect", {
    method: "POST",
    body: form
  });

  if (!res.ok) throw new Error("Backend offline");

  return await res.json();  // { emotion }
}
