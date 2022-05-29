let initialized = false;
function initSound() {
  if (initialized == true) return;
  const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024*2;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);

  console.log(bufferLength)

  const ringBuffer = new Array(64 * 64);
  
  if (navigator.mediaDevices) {
    console.log('getUserMedia supported.');
    navigator.mediaDevices.getUserMedia ({audio: {
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
      sampleRate: 48000,
    }, video: false,})
    .then(function(stream) {
      console.log(stream.getTracks()[0].getSettings())
        // Create a MediaStreamAudioSourceNode
        // Feed the HTMLMediaElement into it
        var source = audioCtx.createMediaStreamSource(stream);
        // Connect the source to be analysed
        source.connect(analyser);
        
        const yOffset = 200;
        // Get a canvas defined with ID "oscilloscope"
        const canvas = document.getElementById("oscilloscope");
        canvas.width = 64 * 4;
        canvas.height = 64 * 4 + yOffset;
        const canvasCtx = canvas.getContext("2d");
        
        // draw an oscilloscope of the current audio source
        draw();

        function draw() {
  
          requestAnimationFrame(draw);
        
          analyser.getFloatTimeDomainData(dataArray);
          const captureTime = analyser.context.currentTime * 48000;
          const sampleOffset = captureTime % (64 * 64);
        
          canvasCtx.fillStyle = "rgb(200, 200, 200)";
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        
          canvasCtx.beginPath();
        
          const sliceWidth = canvas.width * 1.0 / bufferLength;
          let x = 0;
          let avg = 0;
          for (let i = 0; i < bufferLength; i++) {
            ringBuffer[(i + sampleOffset) % (64 * 64)] = dataArray[i];
        
            const v = dataArray[i] + 1;

            const y = v * yOffset / 2;
        
            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
        
            x += sliceWidth;
          }
          // console.log(avg)
          // avg /= bufferLength;

          // avg = Math.min(256, Math.max(10, avg));
          for (let i = 0; i < ringBuffer.length; i++) {
            avg =Math.max(avg,Math.abs(ringBuffer[i]));
          }

          let amp = 3;
          let mag = 4;
          for (let i = 0; i < ringBuffer.length; i++) {
            const x = i % 64;
            const y = Math.floor(i / 64);
            const v = (ringBuffer[i]) / avg * 128 + 128;
            canvasCtx.fillStyle = `rgba(${v},${v},${v},1)`;
            canvasCtx.fillRect(x * mag, y * 4 + yOffset, mag, mag);
          }

          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();
        }

        initialized = true;
    })
    .catch(function(err) {
        console.log('The following gUM error occurred: ' + err);
    });
  } else {
   console.log('getUserMedia not supported on your browser!');
  }
}

window.onmousedown = initSound;
