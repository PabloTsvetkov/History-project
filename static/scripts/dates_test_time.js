document.addEventListener('DOMContentLoaded', () => {
    const questionsURL = "../static/tests_jsons/dates_test.json";
    const totalTimeInMinutes = 20;
    const totalQuestions = 20;

    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let incorrectAnswers = [];
    let helpUsedIndArr = [];
    let QuestionNow = 0;

    let countdown;
    let firstName = undefined;
    let secondName = undefined;
    let speciality = undefined;
    let sex = undefined;


    // document.getElementById('start-button').addEventListener('click', startTest);
    document.getElementById('start-button').addEventListener('click', () => {
        firstName = document.getElementById("firstName").value;
        secondName = document.getElementById("secondName").value;
        sex = document.getElementById("sex").value;
        speciality = document.getElementById("speciality").value;
        if (firstName === "" || secondName === "" || sex === "" || speciality === "") {
            const error = document.createElement('p');
            error.textContent = "Заполните все поля";
            error.style.fontWeight = "bold";
            error.style.color = "red";
            error.style.fontSize = "1.2em";
            error.style.marginTop = "50px";
            document.getElementById('description-container').appendChild(error);
        }
        else {
            startTest();
        }
    });

    function startTest() {
        document.getElementById('description-container').style.display = 'none';
        document.getElementById('question-container').style.display = 'flex';
        let timeLeft = totalTimeInMinutes * 60;

        countdown = setInterval(() => {
            displayTimeLeft(--timeLeft);
            if (timeLeft <= 0) {
                endTest();
                clearInterval(countdown);
            }
        }, 1000);

        fetch(questionsURL)
            .then(response => response.json())
            .then(data => {
                displayCurrentQuestion(data.questions);
            })
            .catch(error => {
                console.error('Error loading questions:', error);
            });
    }

    function displayTimeLeft(timeSeconds) {
        const minutes = Math.floor(timeSeconds / 60);
        const seconds = timeSeconds % 60;
        document.getElementById('timer-container').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function displayCurrentQuestion(questions) {
        if (currentQuestionIndex >= totalQuestions || questions.length === 0) {
            endTest();
            return;
        }

        // const currentQuestion = questions[currentQuestionIndex];
        // const questionContainer = document.getElementById('question-container');
        // questionContainer.innerHTML = '';
        let helpUnusedIndArr = [];
        for (let i = 0; i < questions.length; i++) {
            if (helpUsedIndArr.includes(i, 0) === false) {
                helpUnusedIndArr.push(i);
            }
        }

        let rnd = Math.floor(Math.random() * helpUnusedIndArr.length);
        helpUsedIndArr.push(helpUnusedIndArr[rnd]);
        QuestionNow = helpUnusedIndArr[rnd];

        const currentQuestion = questions[QuestionNow];
        const questionContainer = document.getElementById('question-container');
        questionContainer.innerHTML = '';

        // 
        // Контейнер с номером вопроса и полосой прогресса
        const numberQuestionContainer = document.createElement('div');
        numberQuestionContainer.classList.add('numberQuestionContainer');
        // Номер вопроса
        const qnumber = document.createElement('div');
        qnumber.textContent = currentQuestionIndex + 1;
        qnumber.classList.add('qnumber');
        numberQuestionContainer.appendChild(qnumber);

        // Полоса прогресса
        const progressBar = document.createElement('div');
        progressBar.classList.add('progressBarOuter')
        const progress = document.createElement('div');
        progress.classList.add('progressBarInner');
        progress.style.width = (100 / 20 * currentQuestionIndex) + '%';
        progressBar.appendChild(progress);

        numberQuestionContainer.appendChild(progressBar);
        questionContainer.appendChild(numberQuestionContainer);
        // 


        const questionElement = document.createElement('div');
        questionElement.classList.add('text');
        questionElement.textContent = currentQuestion.question;
        questionContainer.appendChild(questionElement);

        const answerElements = document.createElement('div');
        answerElements.classList.add('answer-options');

        for (let i = 0; i < currentQuestion.answers.length; i++) {
            const answerElement = document.createElement('div');
            answerElement.classList.add('answer-option');
            answerElement.textContent = currentQuestion.answers[i];
            answerElement.addEventListener('click', () => handleAnswerClick(currentQuestion, i));
            answerElements.appendChild(answerElement);
        }

        questionContainer.appendChild(answerElements);
    }

    function handleAnswerClick(question, selectedIndex) {
        if (selectedIndex !== question.correctAnswer) {
            incorrectAnswers.push({
                question: question.question,
                correctAnswer: question.answers[question.correctAnswer]
            });
        } else {
            correctAnswers++;
        }

        currentQuestionIndex++;
        fetch(questionsURL)
            .then(response => response.json())
            .then(data => {
                displayCurrentQuestion(data.questions);
            })
            .catch(error => {
                console.error('Error loading questions:', error);
            });
    }

    function endTest() {
        sendDataToGoogleSheet(firstName, secondName, sex, speciality, correctAnswers);
        clearInterval(countdown);
        document.getElementById('question-container').style.display = 'none';
        showFinalResults();
    }

    function showFinalResults() {
        const main = document.getElementById('main');
        main.style.height = 'auto';
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '';

        const resultSummary = document.createElement('div');
        resultSummary.classList.add('results');
        resultSummary.textContent = `Ваш результат: ${correctAnswers} / ${totalQuestions}`;
        resultsContainer.appendChild(resultSummary);

        if (incorrectAnswers.length > 0) {
            const incorrectAnswersElement = document.createElement('div');
            incorrectAnswersElement.classList.add('incorrect-answers');

            const incorrectTitle = document.createElement('h3');
            incorrectTitle.textContent = 'Вопросы с неправильными ответами:';
            incorrectAnswersElement.appendChild(incorrectTitle);

            incorrectAnswers.forEach(item => {
                const questionElement = document.createElement('div');

                const questionText = document.createElement('p');
                questionText.textContent = `Вопрос: ${item.question}`;
                questionElement.appendChild(questionText);

                const correctAnswerText = document.createElement('p');
                correctAnswerText.textContent = `Правильный ответ: ${item.correctAnswer}`;
                questionElement.appendChild(correctAnswerText);

                incorrectAnswersElement.appendChild(questionElement);
            });

            resultsContainer.appendChild(incorrectAnswersElement);
        }
    }
});

function sendDataToGoogleSheet(firstName, secondName, sex, speciality, correctAnswers) {
    var data = {
        field1: firstName,
        field2: secondName,
        field3: sex,
        field4: speciality,
        field5: correctAnswers
    };

    fetch('https://script.google.com/macros/s/AKfycbwhRPxkIa1e1nhxs0lDb7J2jBGxAKrJ7O-NTbF8MxuVzoR8MzmQ_M7lYD9hrbRgfOXGyA/exec', {
        method: 'POST',
        mode: 'no-cors', // Обратите внимание на этот параметр
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .catch(error => {
            console.error('Ошибка:', error);
        });
}