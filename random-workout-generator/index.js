const exercises = [
  [
    {'forward lunges': [30, 61]},
    {'side lunges': [30, 61]},
    {'high knees': [30, 46]},
    {'squats': [30, 46]},
    {'jump squats': [20, 31]},
    {'glute bridges': [30, 61]},
    {'jumping jacks': [30, 46]},
    {'butt kicks': [30, 46]}
  ],
  [
    {'crunches': [30, 61]},
    {'flutter kicks': [20, 46]},
    {'scissor kicks': [20, 46]},
    {'russian twist': [30, 46]},
    {'superman': [30, 61]},
    {'leg raises': [30, 46]}
  ],
  [
    {'climbers': [30, 61]},
    {'push ups': [20, 31]},
    {'plank rotations': [30, 46]},
    {'high plank': [30, 61]},
    {'elbow plank': [30, 61]},
    {'shoulder taps': [30, 46]}
  ]
]

window.onload = () => {
  //const iframe = document.querySelector('iframe')
  const start = document.querySelector('#start')
  const restart = document.querySelector('.restart')
  const progressBar = document.querySelector('.e-c-progress')
  const pointer = document.getElementById('e-pointer')
  const input = document.querySelector('input')
  const h1 = document.querySelector('h1')
  const body = document.body
  const synth = window.speechSynthesis
  const length = Math.PI * 2 * 100

  let totalSecondsLeft = 0
  let exerciseType
  let widget
  let totalMinutes = 20
  let intervalTimer
  let songTimer
  let timeLeft
  let wholeTime
  let exercise
  let isPaused
  let isStarted = false
  let isDone = false
  let isRest = false
  let isInit = true

  const say = (phrase) => {
    synth.speak(phrase)
    try {
      widget.setVolume(20)
      phrase.onend = () => {
        widget.setVolume(100)
      }
    } catch (e) {}
  }

  const sayExercise = (seconds, exercise) => {
    const phrase = new window.SpeechSynthesisUtterance(`${exercise}, ${seconds} seconds`)
    phrase.volume = 1
    say(phrase)
  }

  const sayCountdown = (number) => {
    const phrase = new window.SpeechSynthesisUtterance(`${number}`)
    phrase.volume = 1
    phrase.pitch = 1.5
    say(phrase)
  }

  // Picks an integer at random from a range, excluding max
  function randRange (max, min) {
    min = min || 0
    const rand = Math.floor(Math.random() * (max - min))
    return min + rand
  }
  // Picks an item at random from an array
  function uniform (array) {
    return array[randRange(array.length)]
  }

  const setBackground = (exercise) => {
    const url =
      //for local version
      //`./img/${exercise.replace(/ /g, '')}-${randRange(6)}-${randRange(10)}.jpg`
      `https://random.training/img/${exercise.replace(/ /g, '')}-${randRange(6)}-${randRange(10)}.jpg`
    body.style.backgroundImage = `url("${url}")`
  }

  const done = () => {
    if (isDone) {
      return
    }
    h1.innerText = 'You\'re Done!\n'
    document.querySelector('.circle').style.display = 'none'
    document.querySelector('.controlls').style.display = 'none'
    document.querySelector('#remaining').style.display = 'none'
    body.style.backgroundImage = ""
    restart.style.display = 'none'

    isDone = true
  }

  const update = (value, timePercent) => {
    const offset = -length - length * value / (timePercent)
    progressBar.style.strokeDashoffset = offset
    pointer.style.transform = `rotate(${360 * value / (timePercent)}deg)`
  }

  const initTimer = () => {
    const pauseBtn = document.getElementById('pause')
    isPaused = false

    // circle start
    progressBar.style.strokeDasharray = length
    // circle ends
    const displayOutput = document.querySelector('.display-remain-time')
    if (isInit) {
      exercise = 'Starting in 10 seconds!'
      wholeTime = 10
      isInit = false
    } else if (isRest) {
      exercise = 'Rest'
      wholeTime = randRange(21, 5)
      isRest = !isRest
    } else {
      let exerciseObject = uniform(exercises[exerciseType])
      exercise = Object.keys(exerciseObject)[0]
      let timeRange = exerciseObject[exercise]
      wholeTime = randRange(timeRange[1], timeRange[0])
      exerciseType = (exerciseType + 1) % 3
      isRest = !isRest
    }

    try {
      setBackground(exercise)
    } catch (e) {
      console.log('could not set background', e)
    }

    if (wholeTime > totalSecondsLeft) {
      wholeTime = totalSecondsLeft
    }
    sayExercise(wholeTime, exercise)
    timeLeft = wholeTime

    h1.innerText = exercise

    update(wholeTime, wholeTime) // refreshes progress bar

    function timer () {
      if (intervalTimer) {
        clearInterval(intervalTimer)
      }
      displayTimeLeft()
      intervalTimer = setInterval(function () {
        timeLeft = timeLeft - 1
        if (timeLeft < 0 && totalSecondsLeft > 0) {
          initTimer()
        } else {
          displayTimeLeft()
          if (timeLeft < 0) {
            clearInterval(intervalTimer)
            sayCountdown('You are now done. How about a snack?')
          } else if (timeLeft < 4) {
            sayCountdown(timeLeft)
          }
        }
      }, 1000)
    }
    function pauseTimer (restart) {
      if (isStarted === false) {
        timer()
        isStarted = true
        pauseBtn.classList.remove('play')
        pauseBtn.classList.add('pause')
        isPaused = false
      } else if (isPaused || restart) {
        pauseBtn.classList.remove('play')
        pauseBtn.classList.add('pause')
        timer()
        isPaused = false
        try {
          widget.play()
        } catch (e) {}
      } else {
        pauseBtn.classList.remove('pause')
        pauseBtn.classList.add('play')
        clearInterval(intervalTimer)
        isPaused = true
        try {
          widget.pause()
        } catch (e) {}
      }
    }
    pauseBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      pauseTimer()
    }

    function displayTimeLeft () {
      const totalMinutesLeft = Math.floor(totalSecondsLeft / 60)
      let remainderSeconds = String(totalSecondsLeft % 60)
      if (remainderSeconds.length < 2) {
        remainderSeconds = '0' + remainderSeconds
      }
      document.querySelector('#timeRemaining').innerText =
        `${totalMinutesLeft}:${remainderSeconds}`
      if (totalSecondsLeft > 0) {
        totalSecondsLeft = totalSecondsLeft - 1
      } else {
        done()
        return
      }
      let minutes = Math.floor(timeLeft / 60)
      let seconds = timeLeft % 60
      let displayString = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
      displayOutput.textContent = displayString
      update(timeLeft, wholeTime)
    }

    body.onkeydown = (e) => {
      if (e.keyCode === 32) {
        // spacebar was hit
        e.preventDefault()
        e.stopPropagation()
        pauseTimer()
      }
    }
    pauseTimer(true)
  }

  function onRestart () {
    exerciseType = randRange(3)
    totalSecondsLeft = Math.ceil(60 * totalMinutes)
    restart.style.display = 'block'
    isRest = false
    initTimer()
  }

  start.addEventListener('click', () => {
    totalMinutes = parseFloat(input.value) || totalMinutes
    document.querySelector('#circleTimer').style.display = 'block'
    document.querySelector('#head').style.display = 'none'
    onRestart()
  })
  document.querySelector('#skip').addEventListener('click', () => {
    onRestart()
  })
  document.querySelector('#reset').addEventListener('click', () => {
    window.location.reload();
  })

  input.focus()
  input.select()
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      start.click()
    }
  }
}
