
var progressStatus = 'bronze';
var canRenderNextQuestion = true;
var canRenderNextAnswer = true;
const questionContainer = getElem('data-question-container');
const nextQuestionButton = getElem('data-next-question-button');
const nextAnswerButton = getElem('data-next-answer-button');
const lifeLineList = getElem('data-lifeline-list');
const silverMilestone = getElem('data-silver');
const goldMilestone = getElem('data-gold');
const sudoPrizerList = getElem('data-prize-list').getElementsByTagName('li');
const prizeList = Array.from(sudoPrizerList).reverse();
const timerContainer = getElem('data-timer');
const timeDisplay = document.getElementById('base-timer-label');
const banner = getElem('data-banner');
const welcomeBanner = getElem('data-welcome');
const congratulationBanner = getElem('data-congratulation');
const loserBanner = getElem('data-loser');
const bannerButton = getElem('data-banner-button');
const TIME_LIMIT = 20;
const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const COLOR_CODES = {
  info: {
    color: "yellow"
  },
  warning: {
   color: "red",
   threshold: WARNING_THRESHOLD
 }
};
const prizeThreshold = {
  0: {
    reached: false
  },
  4: {
    reached: false
  },
  7: {
    reached: false
  },
  10: {
    reached: false
  }
}
let currentBannerType;
let remainingPathColor = COLOR_CODES.info.color;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let gameWon = false;
let gameStarted = false;
let gameEnded = false;
var answerBox = null;
var answerList= null;
var answerListElems = null;
var answerCounter = 0;
var questionBank;
var twoTimesTempAnswer = false;
var disableLifeLineButton =  {
  fiftyFifty: false,
  google: false,
  poll: false,
  timesTwo: false
};
const answerOptions = ['A.', 'B.', 'C.', 'D.'];
var currentQuestionAnswer;
var currentLevel = 0;

bannerButton.addEventListener('click', e => {
  changeBannerState(banner, false);
  changeBannerState(currentBannerType, false);
  if (currentBannerType !== welcomeBanner) {
      initGame();
  }
});

lifeLineList.addEventListener('click', e=> {
  let selectedLifeLine;
  let targetLifeLine =  e.target;
  if (e.target.tagName.toLowerCase() === 'li') {
    selectedLifeLine = targetLifeLine.dataset.id;
  } else { return;}
  if (disableLifeLineButton[selectedLifeLine]) {
    return;
  }
  switch (selectedLifeLine) {
    case 'fiftyFifty':
      fiftyFiftyLogic();
      break;
    case 'google':
        googleLogic();
        break;
    case 'poll':
          pollLogic();
          break;
      case 'timesTwo':
        timesTwoLogic();
        break;
    default:
      console.log('Error on selecting lifeline');
  }
  disableLifeLineButton[selectedLifeLine] = true;
  targetLifeLine.classList.add('disabled');
})
nextQuestionButton.addEventListener('click', e => {
  if (!canRenderNextQuestion) {
        return;
  }
  getNextQuestion();
});
nextAnswerButton.addEventListener('click', e => {
  if (!canRenderNextAnswer) {
    return;
  }
  if (!Boolean(answerBox)) {
    renderAnswerBoxAndList(currentQuestionAndAnswers['answers']);
  }
  renderIndividualAnswer(answerCounter);
  answerCounter++;
  if (answerCounter == 4) {
    canRenderNextAnswer = false;
    canRenderNextQuestion = false;
  }
})

function fetchQuestion() {
  fetch('./data/questionBundle.json')
  .then(res => res.json())
  .then(questions => {
  questionBank = questions;
  })
}
function initGame() {
  resetGameStates();
  resetBannerStates();
  fetchQuestion();
  gameStarted = true;
}
function resetGameStates() {
  gameWon = false;
  gameStarted = false;
}
function setBannerButtonStates() {
  bannerButton.innerText = gameStarted ? 'Return': 'Start';
  if  (gameStarted && !gameWon) {
        bannerButton.classList.add('lost-button');
        return;
  }
  bannerButton.classList.remove('lost-button');
}
function resetBannerStates() {
      resetBanner();
      showBanner(welcomeBanner);
}
function changeBannerState(bannerType, type) {
  if (type) {
    bannerType.classList.remove('remove');
    return;
  }
  bannerType.classList.add('remove');
}


function renderQuestion(question) {
        const questionBox = document.createElement('div');
        questionBox.classList.add('question-box');
        const pTag = document.createElement('p');
        pTag.innerText = question;
        questionBox.appendChild(pTag);
        questionContainer.appendChild(questionBox);
}
function renderIndividualAnswer(counter) {
    const individualAnswer = answerListElems[counter];
    individualAnswer.classList.remove('hide');
}
function getNextQuestion() {
    clearQuestionsAndAnswers();
    resetStates();
    updatePrizeList();
    currentQuestionAndAnswers = getCurrentQuestionAnswer();
    renderQuestion(currentQuestionAndAnswers['question']);
}
function updatePrizeList() {
  updateMilestoneLimit();
  updatePrizeActive();
}
function updateMilestoneLimit() {
  if (currentLevel == 4 || currentLevel == 7) {
    let spanElems;
    if (currentLevel == 4)  {
      spanElems = silverMilestone.children;
    }
    if (currentLevel == 7 ) {
      spanElems = goldMilestone.children;
    }
   for (let i = 0;i < spanElems.length; i++) {
     spanElems[i].classList.add('milestone-limit');
   }
   }
}
function updatePrizeActive() {
  const prizeActiveIndex = currentLevel + 1;
  if (prizeActiveIndex >= 1  && prizeActiveIndex < 5) {
    prizeList[prizeActiveIndex].classList.add('bronze');
    if (prizeActiveIndex !== 1) {
      prizeList[prizeActiveIndex - 1].classList.remove('bronze');
    }
  }
  if (prizeActiveIndex >= 5 && prizeActiveIndex < 8) {
    prizeList[prizeActiveIndex].classList.add('silver');
    if (prizeActiveIndex == 5) {
      prizeList[prizeActiveIndex - 1].classList.remove('bronze');
    }
    if (prizeActiveIndex !== 5) {
      prizeList[prizeActiveIndex - 1].classList.remove('silver');
    }
  }
  if (prizeActiveIndex >= 8 ) {
    prizeList[prizeActiveIndex].classList.add('gold');
    if (prizeActiveIndex == 8) {
      prizeList[prizeActiveIndex - 1].classList.remove('silver');
    }
    if (prizeActiveIndex !== 8) {
      prizeList[prizeActiveIndex - 1].classList.remove('gold');
    }
  }
}
function renderAnswerBoxAndList(answers) {
  answerBox = document.createElement('div');
  answerList = document.createElement('ul');
  answerBox.classList.add('answer-box');
  answerList.classList.add('answer-list');
  answerList.setAttribute('id', 'answer-list');
  answers.forEach((ansObj, i) => {
  const answer = document.createElement('li');
  const answerOpt = document.createElement('span');
  answerOpt.innerText = answerOptions[i];
  answer.innerText = ansObj['answerText'];
  answer.dataset.id = i;
  answer.addEventListener('click', e => {
      const id = e.target.dataset.id;
      if (twoTimesTempAnswer) {
          e.target.classList.add('temp-select');
          twoTimesTempAnswer = false;
          return;
      }
     checkAnswer(id);
  });
    answer.appendChild(answerOpt);
    answer.classList.add('hide');
    answerList.appendChild(answer);
  });
  answerListElems = answerList.getElementsByTagName('li');
  answerBox.appendChild(answerList);
  questionContainer.appendChild(answerBox);
}
function clearQuestionsAndAnswers() {
    while (questionContainer.firstChild) {
        questionContainer.removeChild(questionContainer.firstChild);
    }
}
function resetStates() {
  answerBox = null;
  canRenderNextAnswer = true;
  answerCounter = 0;
}
function getCurrentQuestionAnswer() {
  return questionBank[progressStatus][currentLevel];
}
function getElem(data) {
  return document.querySelector(`[${data}]`);
}
function checkAnswer(id) {
    const allAnswers = currentQuestionAndAnswers['answers'];
    let ansCorrect = false;
    for (let i = 0; i < allAnswers.length; i++) {
      if (id == i)
      {
        const status = allAnswers[id]['status'];
        ansCorrect = (status == 'true');
      }
      setAnswerStatus(allAnswers[i]['status'], i);
    }
    if (ansCorrect) {
      if (currentLevel <= 9) {
        if (currentLevel === 9) {
            gameWin();
            return;
        }
          canRenderNextQuestion = true;
          currentLevel++;
          setPrizeThreshold();
      }
    }
    if (!ansCorrect) {
      gameLost();
    }

}
function setPrizeThreshold(level) {
  if (level == 0 || level == 4 || level == 7 || level == 10) {
          prizeThreshold[level].reached = true;
  }
}
function gameWin() {
  gameWon = true;
  canRenderNextQuestion = false;
  setTimeout(() => {
    showCongratulationBanner();
  }, 4000) ;
}
function gameLost() {
  gameWon = false;
  setTimeout(() => {
    showLostBanner();
  }, 4000) ;
}
function showCongratulationBanner() {
  setCongratulationMessage();
  showBanner(congratulationBanner);
}
function showLostBanner() {
  setLostMessage();
  showBanner(loserBanner);
}
function setCongratulationMessage() {
  const prize = getPrizeValue();
  congratulationBanner.innerHTML = `
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>Congratulations! <br> You have won ${prize}
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>
              <div class="confetti-container confetti">
              </div>`;
}
function setLostMessage() {
      const prize = getPrizeValue();
      loserBanner.innerHTML = `Sorry! Wrong Answer <br> You win ${prize}`;
}
function getPrizeValue() {
    let prizeVal;
    let prizeIndexArray = [];
    let prizeIndex;
    for(const index in prizeThreshold) {
      console.log('index', index);
      if (index <= currentLevel) {
          prizeIndexArray.push(index);
      }
    }
    prizeIndex = Math.max(...prizeIndexArray);
    prizeVal = prizeList[prizeIndex].innerText;
    return `Rs ${prizeVal}`;
}
function showWelcomeBanner() {
  showBanner(welcomeBanner);
}
function showBanner(bannerType) {
  changeBannerState(banner, true);
  changeBannerState(bannerType, true);
  currentBannerType = bannerType;
  setBannerButtonStates();
}
function resetBanner() {
  changeBannerState(banner, false);
  changeBannerState(welcomeBanner,false);
  changeBannerState(congratulationBanner, false);
  changeBannerState(loserBanner, false);
}
function setAnswerStatus(status, id) {
  if (status == 'true') {
      answerListElems[id].classList.add('correct');
      return;
  }
  answerListElems[id].classList.add('incorrect');
}
function fiftyFiftyLogic() {
  const ansToBeRemoved = getTwoAnswerToBeRemoved();
  for (let i = 0; i < 2;i++) {
  let index = ansToBeRemoved[i];
  const answer = answerListElems[index];
  answer.classList.add('hide');
}
}
function googleLogic() {
  timerContainer.classList.remove('remove');
  startTimer();
}
function pollLogic() {
  timerContainer.classList.remove('remove');
  startTimer();
}
function timesTwoLogic() {
  twoTimesTempAnswer = true;
}
function getTwoAnswerToBeRemoved() {
  const ansToBeExcluded = currentQuestionAndAnswers['answers'].findIndex(ansObj => ansObj['status'] === "true");
   let rand = [];
 let setData = [0,1,2,3];
  setData.splice(ansToBeExcluded, 1);
 while(setData.length > 1) {
   let popIndex = Math.floor(Math.random() * setData.length);
   rand.push(setData[popIndex]);
   setData.splice(popIndex, 1);
 }
 return rand;
}
function startTimer() {
  timerInterval = setInterval(() => {
    timePassed = timePassed +=1;
    timeLeft = TIME_LIMIT - timePassed;
    timeDisplay.innerHTML = formatTimeLeft(timeLeft);
    setCircleDasharray();
    setRemainingPathColor(timeLeft);
    if (timeLeft === 0) {
      onTImesUp();
    }
  }, 1000);
}
function formatTimeLeft(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `0${minutes}:${seconds}`;
}
function setRemainingPathColor(timeLeft) {
  const {warning, info } = COLOR_CODES;
  console.log('timeLeft', timeLeft, ' warning', warning.threshold);
 if (timeLeft <= warning.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(warning.color);
      document.getElementById('base-timer-label').classList.add('warning');
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}
function onTImesUp() {
  clearInterval(timerInterval);
  setTimeout(() => {
      timerContainer.classList.add('remove');
  }, 5000)
}
initGame();
