import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [topics, setTopics] = useState([]);
  const [visibleTopic, setVisibleTopic] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [hasSavedSession, setHasSavedSession] = useState(false);

 // topic loader
  useEffect(() => {
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => setTopics(data))
      .catch(err => console.error('Error fetching topics:', err));
  }, []);

  //check for save staete
  useEffect(() => {
    const savedSession = localStorage.getItem('quizSession');
    if (savedSession) {
      setHasSavedSession(true);
    }
  }, []);

  //save the state
  const saveState = (newState = {}) => {
    const stateToSave = {
      selectedQuiz,
      currentQuestionIndex,
      selectedAnswers,
      showResults,
      score,
      ...newState
    };
    localStorage.setItem('quizSession', JSON.stringify(stateToSave)); //ake it local storage
  };

  const toggleSubtopics = (topicID) => {//show subtopics
    setVisibleTopic(visibleTopic === topicID ? null : topicID);
  };

  const loadQuiz = async (quizID) => { //load quiz
    try {
      const res = await fetch(`/api/quiz?quizID=${quizID}`);
      const data = await res.json();
      setSelectedQuiz(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      saveState({
        selectedQuiz: data,
        currentQuestionIndex: 0,
        selectedAnswers: {},
        showResults: false,
        score: 0
      });
    } catch (err) {
      console.error('Error loading quiz:', err); // error handling if quiz fails to load
    }
  };

  // resume saved session but this is brokn????
  const resumeSession = () => {
    const savedSession = JSON.parse(localStorage.getItem('quizSession'));
    if (savedSession) {
      setSelectedQuiz(savedSession.selectedQuiz);
      setCurrentQuestionIndex(savedSession.currentQuestionIndex);
      setSelectedAnswers(savedSession.selectedAnswers);
      setShowResults(savedSession.showResults);
      setScore(savedSession.score);
    }
    setHasSavedSession(false);
  };

  // trash saved session
  const discardSession = () => {
    localStorage.removeItem('quizSession');
    setHasSavedSession(false);
  };

  //select answer
  const handleSelectAnswer = (questionIdx, answer) => {
    const updatedAnswers = { ...selectedAnswers, [questionIdx]: answer };
    setSelectedAnswers(updatedAnswers);
    saveState({ selectedAnswers: updatedAnswers });
  };

  //next question!!!!!
  const handleNext = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      saveState({ currentQuestionIndex: nextIndex });
    } else {
      //score and results
      let correctCount = 0;
      selectedQuiz.questions.forEach((q, i) => {
        if (selectedAnswers[i] === q.answer) correctCount++;
      });
      setScore(correctCount);
      setShowResults(true);
      saveState({ score: correctCount, showResults: true });
    }
  };

  // exit and confirmation
  const handleExit = async () => {
    try {
      await fetch('/api/exit', { method: 'POST' });
      saveState(); // save
    } catch (err) {
      console.error('Error calling /api/exit:', err);
    } finally {
      const confirmExit = window.confirm(
        'Your quiz progress has been saved. Return to main menu?'
      );
      if (confirmExit) {
        returnToMenu();
      }
    }
  };

  // return to main menu, 
  const returnToMenu = () => {
    setSelectedQuiz(null);
    setVisibleTopic(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    localStorage.removeItem('quizSession');
  };

  return ( //for quiz suffs, resume welcomes, and such
    <div className="container">
     
      {hasSavedSession && !selectedQuiz && (
        <div className="resume-popup">
          <h3>resume previous quiz?</h3>
          <p>you have an unfinished quiz. would you like to resume where you left off?</p>
          <div className="resume-buttons">
            <button onClick={resumeSession}>Yes, resume</button>
            <button onClick={discardSession}>No, start fresh</button>
          </div>
        </div>
      )}

      {!selectedQuiz && !hasSavedSession && (
        <>
          <h1>Welcome to Qzicl</h1>
          <div className="topics">
            {topics.map(topic => (
              <div key={topic.id}>
                <button
                  className="topic-btn"
                  onClick={() => toggleSubtopics(topic.id)}
                >
                  {topic.topic}
                </button>
                <div className={`subtopics ${visibleTopic === topic.id ? 'visible' : ''}`}>
                  {topic.quizzes.map(q => (
                    <button key={q.id} onClick={() => loadQuiz(q.id)}>
                      {q.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedQuiz && !showResults && (
        <div className="quiz-container">
          <h2>{selectedQuiz.title}</h2>
          <p>{selectedQuiz.quizMessage}</p>

          <div className="question">
            <p>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</p>
            <h3>{selectedQuiz.questions[currentQuestionIndex].question}</h3>
            {selectedQuiz.questions[currentQuestionIndex].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectAnswer(currentQuestionIndex, opt)}
                className={
                  selectedAnswers[currentQuestionIndex] === opt
                    ? 'answer selected'
                    : 'answer'
                }
              >
                {opt}
              </button>
            ))}
          </div>

          {selectedAnswers[currentQuestionIndex] && (
            <button className="next-btn" onClick={handleNext}>
              {currentQuestionIndex === selectedQuiz.questions.length - 1
                ? 'Done'
                : 'Next'}
            </button>
          )}

          <button className="exit-btn" onClick={handleExit}>Exit Quiz</button>
        </div>
      )}

      {showResults && (
        <div className="results">
          <h2>Results</h2>  
          <p>You scored {score} out of {selectedQuiz.questions.length}</p>
          <button className="back-btn" onClick={returnToMenu}>Return to menu</button>
        </div>
      )}
    </div>
  );
}

export default App;
