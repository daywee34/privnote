const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const app = express();
const port = 8384;

const db = new sqlite3.Database('./db/notes.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

db.run("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_read BOOLEAN DEFAULT 0, read_at DATETIME)");

app.use(bodyParser.json());
app.use(express.static('public'));

function generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
}

app.post('/note', (req, res) => {
    const { content } = req.body;
    const id = generateUniqueId();
    db.run('INSERT INTO notes (id, content) VALUES (?, ?)', [id, content], (err) => {
        if (err) {
            console.error('Error saving the note:', err.message);
            res.status(500).send({ message: 'Error saving the note.' });
            return;
        }
        res.status(201).send({ id, message: 'Note saved.' });
    });
});

app.get('/note/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT content, is_read, read_at FROM notes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error retrieving the note:', err.message);
            res.status(500).send({ message: 'Error retrieving the note.' });
            return;
        }
        if (!row) {
            res.status(404).send({ message: 'Note not found.' });
        } else if (row.is_read) {
            res.status(200).send({ message: 'Note has already been read.', read_at: row.read_at });
        } else {
            res.send({ content: row.content });
            overwriteAndDeleteNote(id);
        }
    });
});

async function overwriteAndDeleteNote(id) {
    const randomData = '';
    await db.run('UPDATE notes SET content = ?, is_read = 1, read_at = datetime("now") WHERE id = ?', [randomData, id], err => {
        if (err) {
            console.error('Error overwriting the note:', err.message);
        }
    });
}

setInterval(function () {
    db.run("DELETE FROM notes WHERE datetime('now') > datetime(created_at, '+7 days')", err => {
        if (err) {
            console.error('Error deleting old notes:', err.message);
        }
    });
}, 24 * 60 * 60 * 1000);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
