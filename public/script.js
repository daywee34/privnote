function generateKey() {
    const rawKey = CryptoJS.lib.WordArray.random(128 / 8).toString();
    return rawKey.substring(0, 16);
}

function encryptNote(content, key) {
    return CryptoJS.AES.encrypt(content, key).toString();
}

function createNote() {
    const key = generateKey();
    const content = document.getElementById('noteInput').value;
    document.getElementById('noteInput').value = '';
    const encryptedContent = encryptNote(content, key);

    fetch('/note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: encryptedContent })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            const idKeyString = `${data.id}_${key}`;
            const encodedLink = btoa(idKeyString);
            const link = `${window.location.origin}/note.html#${encodedLink}`;
            const messageElement = document.getElementById('message');
            const linkToCopy = document.getElementById('linkToCopy');

            linkToCopy.value = link;
            linkToCopy.style.display = 'block';
            linkToCopy.classList.add('textarea');

            messageElement.textContent = `Note created! Link is ready to copy below.`;
            
            const copyButton = document.getElementById('copyLink');
            copyButton.style.display = 'block';
            copyButton.onclick = function() {
                linkToCopy.select();
                document.execCommand('copy');
                messageElement.textContent = 'Link copied to clipboard!';
            };
        } else {
            throw new Error('Server did not return an ID for the note.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Failed to create note. Please try again.';
    });
}


function copyToClipboard() {
    const linkToCopy = document.getElementById('linkToCopy');
    linkToCopy.select();
    document.execCommand('copy');
    document.getElementById('message').textContent = 'Link copied to clipboard!';
}



document.body.classList.add('dark-mode');
document.querySelectorAll('.container, button, textarea, #noteLink, .dark-mode-button').forEach((element) => {
    element.classList.add('dark-mode');
});
