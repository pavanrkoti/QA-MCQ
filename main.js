const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(express.json());

// --- Parse Questions ---
function parseQuestions(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length && !l.startsWith('###'));
    const questions = [];
    let currentQ = '';
    let options = [];

    lines.forEach(line => {
        const qMatch = line.match(/^(\d+)\.\s*(.*)$/);
        if (qMatch) {
            if (currentQ) questions.push({ questionText: currentQ, options });
            currentQ = qMatch[2];
            options = [];
        } else {
            const oMatch = line.match(/^([A-Da-d])\)\s*(.*)$/);
            if (oMatch) options.push(line);
            else currentQ += ' ' + line;
        }
    });
    if (currentQ) questions.push({ questionText: currentQ, options });

    // write log file
    fs.writeFileSync('questions_log.txt', JSON.stringify(questions, null, 2), 'utf-8');
    console.log('questions_log.txt created/overwritten');

    return questions;
}

// --- Parse Answers ---
function parseAnswers(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length && !l.startsWith('###'));
    const answers = [];
    lines.forEach(line => {
        const m = line.match(/^(\d+)\.\s*([A-Da-d])\)\s*(.*)$/);
        if (m) answers.push({ answer: m[2].toUpperCase(), explanation: m[3] });
    });
    return answers;
}

// --- Serve quiz data ---
app.get('/getQuizData', (req, res) => {
    try {
        const qText = fs.readFileSync(path.join(__dirname, 'questions.txt'), 'utf-8');
        const aText = fs.readFileSync(path.join(__dirname, 'answers.txt'), 'utf-8');
        const questions = parseQuestions(qText);
        const answers = parseAnswers(aText);

        res.json({ questions, answers });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error reading quiz files');
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
