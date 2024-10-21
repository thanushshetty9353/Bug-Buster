navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        let video = document.getElementById('webcam');
        video.srcObject = stream;
    })
    .catch(err => {
        document.getElementById('webcamError').textContent = 'Error accessing webcam: ' + err.message;
    });

document.getElementById('captureBtn').addEventListener('click', () => {
    let video = document.getElementById('webcam');
    let canvas = document.createElement('canvas');
    let capturedImage = document.getElementById('capturedImage');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    let imageData = canvas.toDataURL('image/png');
    capturedImage.src = imageData;
    capturedImage.style.display = 'block';

    let usn = document.getElementById('usn').value;

    fetch('/verify_student', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData, usn: usn })
    }).then(response => response.json())
    .then(data => {
        if (data.verified) {
            alert("Verification Successful! You can start the exam.");
            document.getElementById('startExamBtn').disabled = false;
        } else {
            alert("Verification Failed! You are not authorized.");
        }
    }).catch(err => {
        console.error('Error during verification:', err);
    });
});

document.getElementById('startExamBtn').addEventListener('click', () => {
    let examWindow = window.open('/exam', '_blank');

    examWindow.onload = () => {
        if (examWindow.document.documentElement.requestFullscreen) {
            examWindow.document.documentElement.requestFullscreen();
        }

        examWindow.onblur = () => {
            alert("Tab switching is not allowed during the exam!");
            examWindow.focus();
        };

        examWindow.document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            alert("Don't even think about it! Right-click is disabled during the exam.");
        });

        examWindow.document.addEventListener('copy', (event) => {
            event.preventDefault();
            alert("Copying is not allowed during the exam.");
        });

        examWindow.document.addEventListener('paste', (event) => {
            event.preventDefault();
            alert("Pasting is not allowed during the exam.");
        });

        examWindow.document.getElementById('submitButton').addEventListener('click', () => {
            const answers = {
                q1: examWindow.document.querySelector('input[name="q1"]:checked')?.value,
                q2: examWindow.document.querySelector('input[name="q2"]:checked')?.value,
                q3: examWindow.document.querySelector('input[name="q3"]:checked')?.value,
                q4: examWindow.document.querySelector('input[name="q4"]:checked')?.value,
                q5: examWindow.document.querySelector('input[name="q5"]:checked')?.value
            };

            if (Object.values(answers).includes(undefined)) {
                alert("Please answer all questions before submitting!");
                return;
            }

            fetch('/submit_exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(answers)
            })
            .then(response => {
                if (response.ok) {
                    window.open('/submission_success', '_blank');
                } else {
                    alert("There was an error submitting your exam. Please try again.");
                }
            })
            .catch(err => {
                console.error('Error during submission:', err);
            });
        });
    };
});
