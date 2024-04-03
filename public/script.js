function generateIdAndKey() {
    const id = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = CryptoJS.lib.WordArray.random(128 / 8).toString();
    return { id, key };
  }
  
  function encryptNote(content, key) {
    return CryptoJS.AES.encrypt(content, key).toString();
  }
  
  function createNote() {
    const { id, key } = generateIdAndKey();
    const content = document.getElementById('noteInput').value;
    document.getElementById('noteInput').value = '';
    const encryptedContent = encryptNote(content, key);

    fetch('/note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, content: encryptedContent }),
    })
    .then(response => response.json())
    .then(data => {
        const link = `${window.location.href}note.html#${id}_${key}`;
        document.getElementById('message').innerHTML = `Note created! <a href="${link}" id="noteLink" class="dark-mode">View note</a>`;
        
        const copyButton = document.getElementById('copyLink');
        copyButton.style.display = 'inline-block';
        copyButton.onclick = function() {
            navigator.clipboard.writeText(link).then(() => {
                alert('Link copied!');
            }).catch(err => {
                console.error('Error when copying: ', err);
                alert('Error copying the link.');
            });
        };
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Error when creating the note.';
    });
}

document.body.classList.add('dark-mode');
document.querySelectorAll('.container, button, textarea, #noteLink, .dark-mode-button').forEach((element) => {
    element.classList.add('dark-mode');
});

  