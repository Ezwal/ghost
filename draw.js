'use strict'

const { floor, ceil, random } = Math
const canvas = document.getElementById('draw')
canvas.width = window.innerWidth - 20
canvas.height = window.innerHeight - 20

const ctx = canvas.getContext('2d')

const fontHeight = 25
ctx.font = `${fontHeight.toString()}px IBM Plex Mono`

const charWidth = ctx.measureText('0').width
const maxColumnChar = floor(canvas.width / charWidth) - 1
const halfColumnChar = floor(maxColumnChar / 2)
const maxLineChar = floor(canvas.height / fontHeight) + 1
const middleLine = floor(maxLineChar / 2)
console.log('column', maxColumnChar, 'line', maxLineChar, 'middleLine', middleLine)

const intRand = r => floor(random() * r)
const intRandBetween = (a, b) => a + intRand(b - a)
const randomIntChar = () => intRand(10).toString()
const spaceOrChar = p => () => random() > p ? ' ' : randomIntChar() // i.e 1 means all char will numerical ones, at 0 all of them are whitespaces
const takePercentString = (s, p) => s.slice(0, floor(s.length * p))
const char2Hex = c => c.charCodeAt().toString(16)
const distCenterStr = (s, n) => (s.length / 2) - n

const range = n => {
    let res = []
    while (res.length < n) {
        res.push(res.length)
    }
    return res
}
const times = (n, fn) => range(n).map(() => fn())


const backfill = (s, p, r) => {
    const sUp = takePercentString(`  ${s.toUpperCase()}  `, r)
    const fillerLength = maxColumnChar - sUp.length
    const right = times(floor(fillerLength / 2) + 1, spaceOrChar(p))
    const left = times(floor(fillerLength / 2), spaceOrChar(p))
    return [...left, sUp, ...right].join('')
}

const gaussWidth = 6
const randomFill = (toBeSplicedText, textString, revealFactor) => {
    const notReveal = 1 - revealFactor
    let constructed = Array.from(toBeSplicedText)
    let sRevealed = Array.from(takePercentString(textString, revealFactor))
    // let sRevealed = Array.from(textString).slice(0, textString.length*revealFactor + intRandBetween(-2, 2))

    const gaussInsertion = n => floor(halfColumnChar - distCenterStr(sRevealed, n) + intRandBetween(-gaussWidth*notReveal, gaussWidth*notReveal))
    for (let i = 0; i < sRevealed.length; i++) {
        console.log(gaussInsertion(i));
        constructed[gaussInsertion(i)] = sRevealed[i]
    }
    return constructed.join('')
}

const nbReg = /\d/g
const growingVoid = (s, p) => s.replace(nbReg, spaceOrChar(p))

// this function will draw random char for every lines not with a text
const initRender = range(maxLineChar).map(() => times(maxColumnChar, randomIntChar).join(''))
function randomWallDraw(prevRender = initRender, text, options = { disappearFactor: 1, revealFactor: 0 , color: 'white'}) {
    let render = []

    ctx.fillStyle = options.color
    for (let i = 0; i < maxLineChar; i++) { // TODO use FP
        const isTextLine = text.length > 0
                       && i >= middleLine
                       && i < middleLine + text.length
        const randGenLine = growingVoid(prevRender[i], options.disappearFactor)
        let toBeDrawn = randGenLine
        if (isTextLine) {
            toBeDrawn = randomFill(randGenLine, text[i - middleLine], options.revealFactor)
        }
        ctx.fillText(toBeDrawn, charWidth, i * fontHeight)
        render.push(randGenLine)
    }
    return render
}

const clearWindow = () => ctx.clearRect(0, 0, canvas.width, canvas.height)
function* limitWall(frameNumber, textArray) {
    let previousRender = undefined
    for (let a = 0; a<frameNumber; a++) {
        clearWindow()
        const completion = a / frameNumber
        // at the end the text goes from green to white
        const colorGradient = (completion - 0.95) * 200 * 255
        const color = completion < 0.96
              ? 'green' : `rgb(${colorGradient},255,${colorGradient})`
        // we make it disappear more rapidly than a linear scale after half of the frame are displayed
        const disappearFactor = completion < 0.50
              ?  1 : completion < 0.99 ? 0.97 - (completion / 13) : 0 // 1 - (completion - 0.50)
        // the char from the final strings that are progressively revealed
        const revealFactor = completion < 0.50
              ? 0 : (completion - 0.50) * 2.1
        previousRender = randomWallDraw(previousRender, textArray, { disappearFactor, revealFactor, color }) // TODO add text args in it
        yield true
    }
    return false
}

// duration in secs & freq in frame/sec
function freqWall(duration, freq, text) {
    const gen = limitWall(duration * freq, text.split('\n'))
    const interval = setInterval(() => gen.next(), 1000 / freq)
    setTimeout(() => clearInterval(interval), duration * 1000)
}

function revealFactor(text) {
    freqWall(4, 30, text)
}

revealFactor(`Titre

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
`)
