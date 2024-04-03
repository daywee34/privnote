const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const app = express();
const port = 80;

const db = new sqlite3.Database('./db/notes.db', (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

db.run("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/note', (req, res) => {
    const { id, content } = req.body;
    db.get('SELECT id FROM notes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send({ message: 'Error checking the note.' });
            return;
        }
        if (row) {
            res.status(400).send({ message: 'A note with the same ID already exists.' });
        } else {
            db.run('INSERT INTO notes (id, content) VALUES (?, ?)', [id, content], (err) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send({ message: 'Error saving the note.' });
                    return;
                }
                res.status(201).send({ message: 'Note saved.' });
            });
        }
    });
});

function overwriteAndDeleteNote(id) {
    const overwriteTimes = 3;
    let promise = Promise.resolve();

    for (let i = 0; i < overwriteTimes; i++) {
        promise = promise.then(() => new Promise((resolve, reject) => {
            const randomString = crypto.randomBytes(64).toString('hex');
            db.run('UPDATE notes SET content = ? WHERE id = ?', [randomString, id], err => {
                if (err) {
                    console.error('Error overwriting the note:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }));
    }

    promise.then(() => {
        db.run('DELETE FROM notes WHERE id = ?', id, err => {
            if (err) {
                console.error('Error deleting the note:', err.message);
            }
        });
    }).catch(err => console.error('An error occurred:', err));
}

app.get('/note/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT content FROM notes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error retrieving the note:', err.message);
            res.status(500).send({ message: 'Error retrieving the note.' });
            return;
        }
        if (row) {
            res.send(row.content);
            overwriteAndDeleteNote(id);
        } else {
            res.status(404).send({ message: 'Note not found.' });
        }
    });
});

function deleteOldNotes() {
    const daysToKeep = 14;
    const selectSql = `SELECT id FROM notes WHERE created_at < datetime('now', '-${daysToKeep} days')`;

    db.all(selectSql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }

        rows.forEach(row => {
            overwriteAndDeleteNote(row.id);
        });
    });
}

deleteOldNotes();
setInterval(deleteOldNotes, 24 * 60 * 60 * 1000);

app.listen(port, () => {
    console.log(`Server is running under http://localhost:${port}`);
});
