let questions = [];
let answers = [];
let currentQIndex = 0;
let numQuestions = 10;

const startBtn = document.getElementById('startBtn');
const quizContainer = document.getElementById('quizContainer');
const questionArea = document.getElementById('questionArea');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const skipBtn = document.getElementById('skipBtn');
const nextBtn = document.getElementById('nextBtn');
const cancelBtn = document.getElementById('cancelBtn');
const timerElem = document.getElementById('timer');

let userAnswers = [];
let timer;
let timeLeft = 30;

async function loadQuizData() {
    try {
        const res = await fetch('/getQuizData');
        const data = await res.json();
        questions = data.questions;
        answers = data.answers;
    } catch (err) {
        console.error(err);
        alert('Failed to load quiz data.');
    }
}

// function startQuiz() {
//     const select = document.getElementById('numQuestions');
//     numQuestions = Math.min(parseInt(select.value), questions.length);
//     userAnswers = new Array(numQuestions).fill(null);
//     currentQIndex = 0;

//     document.getElementById('numQuestions').style.display = 'none';
//     startBtn.style.display = 'none';
//     quizContainer.style.display = 'block';
//     showQuestion();
// }
async function startQuiz() {
    await loadQuizData(); // wait for server data

    const select = document.getElementById('numQuestions');
    numQuestions = Math.min(parseInt(select.value), questions.length);

    if (numQuestions === 0) {
        alert("No questions available!");
        return;
    }

    userAnswers = new Array(numQuestions).fill(null);
    currentQIndex = 0;

    document.getElementById('numQuestions').style.display = 'none';
    startBtn.style.display = 'none';
    quizContainer.style.display = 'block';
    showQuestion();
    console.log("Number of questions loaded:", questions.length);

}


function showQuestion() {
    clearInterval(timer);
    const q = questions[currentQIndex];
    questionArea.innerHTML = `<h3>Q${currentQIndex+1}: ${q.questionText}</h3>`;
    q.options.forEach((opt, i) => {
        const id = `opt${i}`;
        questionArea.innerHTML += `
            <label>
                <input type="radio" name="answer" value="${opt[0]}"> ${opt}
            </label>
        `;
    });

    progressText.textContent = `Question ${currentQIndex+1} of ${numQuestions}`;
    progressFill.style.width = `${((currentQIndex+1)/numQuestions)*100}%`;

    timeLeft = 30;
    timerElem.textContent = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        timerElem.textContent = timeLeft;
        if (timeLeft <= 0) nextQuestion();
    }, 1000);
}

function nextQuestion() {
    const selected = document.querySelector('input[name="answer"]:checked');
    userAnswers[currentQIndex] = selected ? selected.value : 'Skipped';
    currentQIndex++;
    if (currentQIndex >= numQuestions) {
        showResults();
    } else showQuestion();
}

function skipQuestion() {
    userAnswers[currentQIndex] = 'Skipped';
    currentQIndex++;
    if (currentQIndex >= numQuestions) showResults();
    else showQuestion();
}

function cancelQuiz() {
    clearInterval(timer);
    location.reload();
}

function showResults() {
    clearInterval(timer);
    let html = '<h2>Results</h2>';
    let correct = 0, incorrect = 0, skipped = 0;

    for (let i=0; i<numQuestions; i++) {
        const user = userAnswers[i];
        const ansObj = answers[i];
        let status = '';
        if (user === 'Skipped') { skipped++; status = '<span class="incorrect">Skipped</span>'; }
        else if (user === ansObj.answer) { correct++; status = '<span class="correct">Correct</span>'; }
        else { incorrect++; status = '<span class="incorrect">Incorrect</span>'; }

        html += `<div>
            Q${i+1}: ${questions[i].questionText} <br>
            Your answer: ${user} | Correct: ${ansObj.answer} | ${status}<br>
            Explanation: ${ansObj.explanation || 'N/A'}
        </div><hr>`;
    }

    html += `<h3>Score: ${correct}/${numQuestions}</h3>
             <h4>Skipped: ${skipped} | Incorrect: ${incorrect}</h4>`;

    questionArea.innerHTML = html;
    skipBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    cancelBtn.textContent = 'Restart Test';
}

startBtn.onclick = startQuiz;
nextBtn.onclick = nextQuestion;
skipBtn.onclick = skipQuestion;
cancelBtn.onclick = cancelQuiz;
