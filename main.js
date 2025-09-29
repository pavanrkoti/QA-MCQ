const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(express.json());

// --- Parse Questions ---
function parseQuestions(text) {
    const lines = text.split('\n').map(l => l.trim());
    const questions = [];
    let currentQ = null;
    let options = [];

    lines.forEach(line => {
        // Skip section headers or decorative markers
        if (!line || line.startsWith('###') || line.startsWith('---')) return;

        const qMatch = line.match(/^(\d+)\.\s*(.*)$/);
        if (qMatch) {
            // If we were working on a question, push it before starting new one
            if (currentQ) {
                questions.push({ questionText: currentQ.trim(), options });
            }
            currentQ = qMatch[2].trim();
            options = [];
        } else {
            const oMatch = line.match(/^([A-Da-d])\)\s*(.*)$/);
            if (oMatch) {
                options.push(line.trim());
            } else if (currentQ) {
                // Treat as continuation line for the current question
                currentQ += ' ' + line;
            }
        }
    });

    // Push the last question if present
    if (currentQ) {
        questions.push({ questionText: currentQ.trim(), options });
    }

    // Write log file with count
    try {
        fs.writeFileSync('questions_log.txt', JSON.stringify(questions, null, 2), 'utf-8');
        console.log(`questions_log.txt created with ${questions.length} questions`);
    } catch (err) {
        console.error('Failed to write questions_log.txt:', err);
    }

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
