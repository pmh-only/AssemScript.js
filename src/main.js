let STOP = false

const codeElem   = document.getElementsByName('code')[0]
const outputElem = document.getElementsByName('output')[0]
const dumpsElem  = document.getElementsByName('dumps')[0]

const runElem   = document.getElementsByName('run')[0]
const stopElem  = document.getElementsByName('stop')[0]
const clearElem = document.getElementsByName('clear')[0]
const resetElem = document.getElementsByName('reset')[0]

const speedElem = document.getElementsByName('speed')[0]
const splabelElem = document.getElementsByName('splabel')[0]

splabelElem.innerText = '실행 속도: ' + speedElem.value + 'ms당 1스텝'

runElem.onclick   = () => run(codeElem.value)
stopElem.onclick  = () => STOP = true
clearElem.onclick = () => { outputElem.value = ''; dumpsElem.value = '' }
resetElem.onclick = () => codeElem.value = ''
speedElem.oninput = () => splabelElem.innerText = '실행 속도: ' + speedElem.value + 'ms당 1스텝'

function run (code) {
  STOP = false
  outputElem.value = ''
  runElem.disabled = true
  speedElem.disabled = true
  outputElem.style.borderColor = ''

  const lines = codeElem.value.split('\n')

  let currLine = 0
  let pointer = 0
  const variables = []
  const assets = {}

  const interval = setInterval(() => {
    if (STOP) { STOP = false; stop() }
    if (currLine >= lines.length - 1) { STOP = false; stop() }

    parseLine(lines[currLine])
    dumpsElem.value =
      'Variables:\n' + variables.reduce((prev, curr, i) => prev + ((i === pointer ? '>' : ' ') + i++ + '. ' + (curr ?? '')) + '\n', '') +
      '\n\nArguments:\n' + (pointer == -1 ? '>' : ' ') + '-1: ' + (variables[-1] ?? '') +
      '\n' + (pointer == -2 ? '>' : ' ') + '-2: ' + (variables[-2] ?? '') +
      '\n' + (pointer == -3 ? '>' : ' ') + '-3: ' + (variables[-3] ?? '') +
      '\n\nAssets:\n' + Object.keys(assets).reduce((prev, curr) => prev + ` ${curr}: ${assets[curr]}\n`, '') +
      '\n\nLine: (' + currLine + '/' + lines.length + ')\n' + (lines[currLine].split('//')[0] || '')
    currLine++
  }, speedElem.value)

  function parseLine (code) {
    if (code.startsWith('//') || !code) return
    const [opcode, arg0, ...args] = code.split(' ')

    switch (opcode.toUpperCase()) {
      case '#ASSET': {
        const index = parseInt(arg0)
        const content = args.join(' ')

        if (isNaN(index) || index < 0)
          return panic('잘못된 문법: 유효하지 않은 에셋 주소')

        if (!content)
          return panic('잘못된 문법: 값이 지정되지 않음')

        assets[index] = eval(content)
        break
      }

      case 'MOV': {
        const index = parseInt(arg0)

        if (isNaN(index)) {
          if (index === 'nxt') pointer++
          else if (index === 'prv') pointer--
          else panic('잘못된 문법: 알 수 없는 이동위치')
          return
        }

        pointer = index
        break
      }

      case 'VAL': {
        const index = parseInt(arg0)
        
        if (isNaN(index)) {
          if (index === '++') variables[pointer]++
          else if (index === '--') variables[pointer]--
          else panic('잘못된 문법: 알 수 없는 이동위치')
          return
        }

        variables[pointer] = index
        break
      }

      case 'CAL': {
        const currLib = library[variables[0]]
        if (currLib) currLib()
        break
      }
    }
  }

  function printOut (str) {
    outputElem.value += str
    outputElem.scrollTo(0, 9999)
  }

  function panic (msg) {
    STOP = true
    outputElem.value += `\n\n! PANIC !\n${msg}`
    stop()
  }

  function stop () {
    runElem.disabled = false
    speedElem.disabled = false
    clearInterval(interval)
  }

  const library = {
    0: () => {},
    1: () => variables[variables[-2]] = variables[variables[-1]],
    2: () => variables[variables[-2]] = assets[variables[-1]],
    3: () => eval(variables[-2]),
    4: () => variables[variables[-3]] = variables[variables[-1]] == variables[variables[-2]],
    5: () => variables[variables[-3]] = variables[variables[-1]] & variables[variables[-2]],
    6: () => variables[variables[-3]] = variables[variables[-1]] | variables[variables[-2]],
    7: () => variables[variables[-2]] = !variables[variables[-1]],
    8: () => variables[variables[-3]] = variables[variables[-1]] > variables[variables[-2]],
    100: () => printOut(String.fromCharCode(variables[variables[-1]])),
    101: () => printOut(variables[variables[-1]]),
    102: () => printOut(Number(variables[variables[-1]])),
    103: () => variables[variables[-1]] = prompt( lines[currLine] + '의 의한 입력'),
    104: () => variables[variables[-1]] = Number(prompt()),
  }
}