
var currentQuestionIndex = 0;
var progressStatus = 'bronze';
var canRenderNextQuestion = false;
var canRenderNextAnswer = false;
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
var currentQuestionAnswer;
var currentLevel = 0;
var tempAns = 0;
var clockSound = new Audio('./assets/sounds/clockSound.mp3');
var mainSound = new Audio('./assets/sounds/questionSound.mp3');
var nextQuestionSound = new Audio('./assets/sounds/nextQuestion.mp3');
var wrongAnswerSound = new Audio('./assets/sounds/optionLockSound.mp3');
var suspenseSound = new Audio('./assets/sounds/suspense.mp3');
var suspenseSoundInterval;


const questionContainer = getElem('data-question-container');
const nextQuestionButton = getElem('data-next-question-button');
const nextAnswerButton = getElem('data-next-answer-button');
const readyButton = getElem('data-ready-button');
const quitButton = getElem('data-quit-button');
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
let questionSetNumber = getElem('data-question-set-number');

const answerOptions = ['A.', 'B.', 'C.', 'D.'];
const TIME_LIMIT = 15;
const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 7;
const COLOR_CODES = {
  info: {
    color: "gold"
  },
  warning: {
   color: "red",
   threshold: WARNING_THRESHOLD
 }
};



let prizeThreshold = {
  0: {
    index: 0,
    reached: false,
    previousLevel: 'bronze',
    level: "bronze",
    nextLevel: "bronze"
  },
  4: {
    index: 4,
    reached: false,
    previousLevel: 'bronze',
    level: "bronze",
    nextLevel: "silver"
  },
  7: {
    index: 7,
    reached: false,
    previousLevel: 'bronze',
    level: "silver",
    nextLevel: "gold"
  },
  10: {
    index: 10,
    reached: false,
    previousLevel: 'silver',
    level: "gold",
    nextLevel: "gold"
  }
}
let currentBannerType;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let gameWon = false;
let gameStarted = false;
let gameQuit = false;


/**  -- Event Listeners --  **/

/** Quit the show by contestant  **/
quitButton.addEventListener('click', e => {
    wrongAnswerSound.play();
    gameQuit = true;
    resetStates();
    gameLost();
});

/** handle  start or return options  **/
bannerButton.addEventListener('click', e => {
  changeBannerState(banner, false);
  changeBannerState(currentBannerType, false);
  if (currentBannerType !== welcomeBanner) {
      currentQuestionIndex++;
      initGame();
  }
});

/** handle lifelines **/
lifeLineList.addEventListener('click', e=> {
  let selectedLifeLine;
  let targetLifeLine =  e.target;
  if (e.target.tagName.toLowerCase() === 'li') {
    selectedLifeLine = targetLifeLine.dataset.id;
  } else { return;}
  if (disableLifeLineButton[selectedLifeLine]) {
    return;
  }
  executeLifeLine(selectedLifeLine);
  disableLifeLineButton[selectedLifeLine] = true;
  toggleClass(targetLifeLine, 'disabled', true);
});

/** smooth transition to start the game  **/
readyButton.addEventListener('click', e => {
    console.log('click')
  if (gameStarted) {
    return;
  }
  fetchQuestion();
  mainSound.play();
  resetQuestionNavigationButtons(false);
  gameStarted = true;
  canRenderNextQuestion = true;
});

/**  show next question on click  **/
nextQuestionButton.addEventListener('click', e => {
  if (!canRenderNextQuestion) {
        return;
  }
  nextQuestionSound.play();
  suspenseSound.play();
  suspenseSoundInterval =  setInterval(() => {
        suspenseSound.play();
    }, 50000);
  clearInterval()
  getNextQuestion();
  canRenderNextQuestion = false;
  canRenderNextAnswer = true;
});

/**  show individual answer on click  **/
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
  }
});

/** toggle element class **/
function toggleClass(elem, className, bool) {
    if (bool) {
      elem.classList.add(className);
      return;
    }
    elem.classList.remove(className);
}

/** run the life line as selected **/
function executeLifeLine(selectedLifeLine) {
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
}

/**  fetch the question from API **/
function fetchQuestion() {
    if (questionSetNumber.value <= 0) {
        questionSetNumber.value = 1;
    }
  fetch(`./data/question${--questionSetNumber.value}.json`)
  .then(res => res.json())
  .then(questions => {
  questionBank = questions;
  })
}

/**  start the game **/
function initGame() {
  resetGameDesign();
  resetGameStates();
  resetBannerStates();
}

/**  re- render game design **/
function resetGameDesign() {
  resetPrizeList();
  resetLifeLine();
  resetQuestionContainer();
  resetQuestionNavigationButtons(true);
}

/** re-render buttons //
 if bool is true it adds the class and vice versa
 bool is set to false for begining reseting when game starts
 bool is set to true for reseting when game restarts **/
function resetQuestionNavigationButtons(bool) {
  toggleClass(nextQuestionButton, 'hide' , bool);
  toggleClass(nextAnswerButton, 'hide', bool);
  toggleClass(quitButton, 'hide', bool);
  toggleClass(readyButton, 'hide', !bool);
}

/** reset the prizelist design on restart  **/
function resetPrizeList() {
  const classLevel = getLevelClass();
  if (currentLevel == 10) {
    --currentLevel;
  }
  toggleClass( prizeList[currentLevel + 1], classLevel, false);
  resetLimitMilestone();
}

/** resetting the milestone bar in prize list **/
function resetLimitMilestone() {
    const silverLimit = getElem('data-silver').getElementsByTagName('span');
    const goldLimit = getElem('data-gold').getElementsByTagName('span');
    for(let i = 0;i < 2; i++) {
      toggleClass(silverLimit[i], 'milestone-limit', false);
      toggleClass(goldLimit[i], 'milestone-limit', false);
    }
}

/** reseting the selected lifeline css  **/
function resetLifeLine() {
    const lifelines = Array.from(getElem('data-lifeline-list').getElementsByTagName('li'));
    lifelines.forEach((lifeline) => {
      toggleClass(lifeline, 'disabled', false);
    });
}

/** reseting the question container on restart  **/
function resetQuestionContainer() {
    clearQuestionsAndAnswers();
}

/** get the level the class (bronze, silver, gold) according to the current level  **/
function getLevelClass() {
  const threshold = getPrizeThresholdInfo();
  return threshold['nextLevel'];
}

/**  get the threshold details for manipulating the prize **/
function getPrizeThresholdInfo() {
  let prizeIndexArray = getPrizeThresholdArray();
  prizeIndex = Math.max(...prizeIndexArray);
  return prizeThreshold[prizeIndex];
}

/** get  the threshold indexes **/
function getPrizeThresholdArray() {
  let prizeIndexArray = [];
  for (const index in prizeThreshold) {
    if (index <= currentLevel) {
        prizeIndexArray.push(index)
    }
  }
  return prizeIndexArray;
}
function getPrizeThresholdCategoryIndex() {
  const prizeIndexes = [0,4,7,10];
  const maxPrizeIndex = Math.max(...getPrizeThresholdArray());
  const indexOfMaxPrizeIndex = prizeIndexes.indexOf(maxPrizeIndex);
  if ( indexOfMaxPrizeIndex !== -1 &&  (indexOfMaxPrizeIndex < (prizeIndexes.length - 1))) {
    return prizeIndexes[indexOfMaxPrizeIndex + 1];
  }
}

/** reseting game counters on restart  **/
function resetGameStates() {
  gameWon = false;
  gameStarted = false;
  answerBox = null;
  answerList= null;
  answerListElems = null;
  answerCounter = 0;
  questionBank = null;
  currentLevel = 0;
  twoTimesTempAnswer = false;
  resetingLifeLineButtons();
  resetingPrizeThreshold();
}

/** resetting prize threshold **/
function resetingPrizeThreshold() {
  prizeThreshold = {
    0: {
      index: 0,
      reached: false,
      previousLevel: 'bronze',
      level: "bronze",
      nextLevel: "bronze"
    },
    4: {
      index: 4,
      reached: false,
      previousLevel: 'bronze',
      level: "bronze",
      nextLevel: "silver"
    },
    7: {
      index: 7,
      reached: false,
        previousLevel: 'bronze',
      level: "silver",
      nextLevel: "gold"
    },
    10: {
      index: 10,
      reached: false,
      previousLevel: 'silver',
      level: "gold",
      nextLevel: "gold"
    }
  };
}

/** reactivating the disabled lifelines **/
function resetingLifeLineButtons() {
  disableLifeLineButton =  {
    fiftyFifty: false,
    google: false,
    poll: false,
    timesTwo: false
  };
}

/**  rendering the button design and text in banner **/
function setBannerButtonStates() {
  bannerButton.innerText = gameStarted ? 'Return': 'Enter';
  if  (gameStarted && !gameWon) {
        toggleClass(bannerButton, 'lost-button', true);
        return;
  }
  toggleClass(bannerButton, 'lost-button', false);
}

/**  rendering the banner **/
function resetBannerStates() {
      resetBanner();
      showBanner(welcomeBanner);
}

/**  show or hide the banner **/
function changeBannerState(bannerType, type) {
  if (type) {
    toggleClass(bannerType, 'remove', false);
    return;
  }
   toggleClass(bannerType, 'remove', true);
}

/** creating the question box container and render it  **/
function renderQuestion(question) {
        const questionBox = document.createElement('div');
        questionBox.classList.add('question-box');
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = './assets/image/kbcanswerbg.png';
        figure.appendChild(img);
        questionBox.appendChild(figure);
        const pTag = document.createElement('p');
        pTag.innerText = question;
        questionBox.appendChild(pTag);
        questionContainer.appendChild(questionBox);
}

/** rendering individual answer on button click  **/
function renderIndividualAnswer(counter) {
    const individualAnswer = answerListElems[counter];
    toggleClass(individualAnswer, 'hide', false);
}

/**  get next question on button click **/
function getNextQuestion() {
    clearQuestionsAndAnswers();
    resetStates();
    updatePrizeList();
    currentQuestionAndAnswers = getCurrentQuestionAnswer();
    renderQuestion(currentQuestionAndAnswers['question']);
}

/** re-render prize list based on level update  **/
function updatePrizeList() {
  updateMilestoneLimit();
  updatePrizeActive();
}

/** render the milestone achieved **/
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
     toggleClass(spanElems[i], 'milestone-limit', true);
   }
   }
}

/** render the amount of pize won  **/
function updatePrizeActive() {
  const prizeActiveIndex = currentLevel + 1;
  const maxThresholdIndex = getPrizeThresholdCategoryIndex();
  const previousActiveState = prizeThreshold[maxThresholdIndex]['previousLevel'];
  const currentActiveState = prizeThreshold[maxThresholdIndex]['level']
  if (prizeActiveIndex == 5 || prizeActiveIndex == 8)  {
    toggleClass(prizeList[prizeActiveIndex], currentActiveState, true);
    toggleClass(prizeList[prizeActiveIndex-1], previousActiveState, false);
    return;
  }
  toggleClass(prizeList[prizeActiveIndex], currentActiveState, true);
  toggleClass(prizeList[prizeActiveIndex-1], currentActiveState, false);
}

/** rendering the answers in list  **/
function renderAnswerBoxAndList(answers) {
  answerBox = document.createElement('div');
  answerList = document.createElement('ul');
  toggleClass(answerBox, 'answer-box', true);
  toggleClass(answerList, 'answer-list', true);
  answerList.setAttribute('id', 'answer-list');
  answers.forEach((ansObj, i) => {
  const answer = document.createElement('li');
  const figure = document.createElement('figure');
  const imageElem = document.createElement('img');
  const answerOpt = document.createElement('span');
  imageElem.src = './assets/image/kbcanswerbg.png';
 // figure.appendChild(imageElem);
  answerOpt.innerText = answerOptions[i];
  answer.innerText = ansObj['answerText'];
  answer.dataset.id = i;
  answer.addEventListener('click', e => {
      setAnswerEventListener(e);
  });

    answer.appendChild(answerOpt);
    toggleClass(answer, 'hide', true);
    answerList.appendChild(answer);
  });
  answerListElems = answerList.getElementsByTagName('li');
  answerBox.appendChild(answerList);
  questionContainer.appendChild(answerBox);
}


/** setting event listener for each answer **/
function setAnswerEventListener(evt) {
    console.log('evt', evt);
  const id = evt.target.dataset.id;
  console.log('id', id);
  if (twoTimesTempAnswer) {
      toggleClass(evt.target, 'temp-select', true);
      twoTimesTempAnswer = false;
      tempAns = id;
      return;
  }Times
 checkAnswer(id);
}

/** clearing the questions and answer on restart **/
function clearQuestionsAndAnswers() {
    while (questionContainer.firstChild) {
        questionContainer.removeChild(questionContainer.firstChild);
    }
}

/**  reseting question answer logic states **/
function resetStates() {
  answerBox = null;
  canRenderNextAnswer = true;
  answerCounter = 0;
}

/** get the current question **/
function getCurrentQuestionAnswer() {
  return questionBank[progressStatus][currentLevel];
}

/** get element based on query selector**/
function getElem(data) {
  return document.querySelector(`[${data}]`);
}

/** check whether the selected answer is correct**/
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
    if (!ansCorrect) {
      for (let i = 0; i < allAnswers.length; i++) {
        if (tempAns == i)
        {
          const status = allAnswers[tempAns]['status'];
          ansCorrect = (status == 'true');
        }
        setAnswerStatus(allAnswers[i]['status'], i);
      }
    }
    if (ansCorrect) {
      if (currentLevel <= 9) {
        if (currentLevel === 9) {
            gameWin();
            suspenseSound.pause();
            clearInterval(suspenseSoundInterval);
            mainSound.play();
            return;
        }
          canRenderNextQuestion = true;
          currentLevel++;
          setPrizeThreshold();
      }
      setTimeout(() => {
            suspenseSound.pause();
            clearInterval(suspenseSoundInterval);
            mainSound.play();
      }, 2000);
    }
    if (!ansCorrect) {
      wrongAnswerSound.play();
      gameLost();
    }

}

/**  counter the miletone has been reached or not **/
function setPrizeThreshold(level) {
  if (level == 0 || level == 4 || level == 7 || level == 10) {
          prizeThreshold[level].reached = true;
  }
}
/** game win logic **/
function gameWin() {
  currentLevel++;
  setPrizeThreshold(currentLevel);
  gameWon = true;
  canRenderNextQuestion = false;
  setTimeout(() => {
    showCongratulationBanner();
  }, 4000) ;
}

/**  game lose logic **/
function gameLost() {
  gameWon = false;
  setTimeout(() => {
    showLostBanner();
  }, 4000) ;
}

/** show banner according to their type  **/
function showCongratulationBanner() {
  setCongratulationMessage();
  showBanner(congratulationBanner);
}
/**  show banner when a contestant gives the wrong answer **/
function showLostBanner() {
  setLostMessage();
  showBanner(loserBanner);
}

/** show the message when contestant has won the optimum prize  **/
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
/** setting the lost message whenver the contestant  gives wrong answer or quits **/
function setLostMessage() {
      const prize = getPrizeValue();
      let msg = '';
      if (!gameQuit) {
        msg = 'Wrong Answer';
      }
      loserBanner.innerHTML = `Sorry! ${msg} <br> You win ${prize}`;
}

/** get the prize amount baased on milestone achieved  **/
function getPrizeValue() {
    let prizeIndexArray = getPrizeThresholdArray();
    let prizeIndex = getPrizeThresholdInfo()['index'];
    if (!gameQuit && !gameWon) {
      if (prizeIndexArray.length == 3) {
            prizeIndex = prizeThreshold[prizeIndexArray[1]]['index'];
      }
      if (prizeIndexArray.length < 3) {
        prizeIndex = prizeThreshold[prizeIndexArray[0]]['index'];
      }
    }
    prizeVal = prizeList[prizeIndex].innerText;
    return `Rs ${prizeVal}`;
}
/** showing the welcome banner in the screen **/
function showWelcomeBanner() {
  showBanner(welcomeBanner);
}

/** render the banner  **/
function showBanner(bannerType) {
  changeBannerState(banner, true);
  changeBannerState(bannerType, true);
  currentBannerType = bannerType;
  setBannerButtonStates();
}

/**  reseting the banner to default sstate  **/
function resetBanner() {
  changeBannerState(banner, false);
  changeBannerState(welcomeBanner,false);
  changeBannerState(congratulationBanner, false);
  changeBannerState(loserBanner, false);
}

/** adding class to render the wrong and right answers **/
function setAnswerStatus(status, id) {
  if (status == 'true') {
      toggleClass(answerListElems[id], 'correct', true);
      return;
  }
    toggleClass(answerListElems[id], 'incorrect', true);
}

/** hide two answers   **/
function fiftyFiftyLogic() {
  const ansToBeRemoved = getTwoAnswerToBeRemoved();
  for (let i = 0; i < 2;i++) {
  let index = ansToBeRemoved[i];
  const answer = answerListElems[index];
  toggleClass(answer, 'hide', true);
}
}

/** show timer when google is selected  **/
function googleLogic() {
  toggleClass(timerContainer, 'remove', false);
  startTimer();
}

/**  show timer when poll is selected  **/
function pollLogic() {
    toggleClass(timerContainer, 'remove', false);
    startTimer();
}

/** allow the user to choose two answers  **/
function timesTwoLogic() {
  twoTimesTempAnswer = true;
}

/** remove two ansers when fifty fitfty is selected  **/
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

/**  starting and showing the timer **/
function startTimer() {
    clockSound.play();
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

/** setting the format of time to be shown  **/
function formatTimeLeft(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `0${minutes}:${seconds}`;
}

/**  changing the color of timer based on time remaining  **/
function setRemainingPathColor(timeLeft) {
  const {warning, info } = COLOR_CODES;
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

/** calculating the remaining time **/
function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

/** manipulating the timer circle  **/
function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}

/** clearning the timer whnen times up and reseting css  **/
function onTImesUp() {
  clearInterval(timerInterval);

  setTimeout(() => {
      resetTimer();
      toggleClass(timerContainer, 'remove', true);
  }, 5000)
}

/** reseting the timer states after timer is cleared **/
function resetTimer() {
  timerInterval = null;
  timePassed = 0;
  timeLeft = TIME_LIMIT;
    document.getElementById('base-timer-label').classList.remove('warning');
    document.getElementById("base-timer-path-remaining")
    .classList.remove('red');
}

/** game start point **/
initGame();
