"use strict";

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var STOP = false;
var codeElem = document.getElementsByName('code')[0];
var outputElem = document.getElementsByName('output')[0];
var dumpsElem = document.getElementsByName('dumps')[0];
var runElem = document.getElementsByName('run')[0];
var stopElem = document.getElementsByName('stop')[0];
var clearElem = document.getElementsByName('clear')[0];
var resetElem = document.getElementsByName('reset')[0];
var speedElem = document.getElementsByName('speed')[0];
var splabelElem = document.getElementsByName('splabel')[0];
splabelElem.innerText = '실행 속도: ' + speedElem.value + 'ms당 1스텝';

runElem.onclick = function () {
  return run(codeElem.value);
};

stopElem.onclick = function () {
  return STOP = true;
};

clearElem.onclick = function () {
  outputElem.value = '';
  dumpsElem.value = '';
};

resetElem.onclick = function () {
  return codeElem.value = '';
};

speedElem.oninput = function () {
  return splabelElem.innerText = '실행 속도: ' + speedElem.value + 'ms당 1스텝';
};

function run(code) {
  STOP = false;
  outputElem.value = '';
  runElem.disabled = true;
  speedElem.disabled = true;
  outputElem.style.borderColor = '';
  var lines = codeElem.value.split('\n');
  var currLine = 0;
  var pointer = 0;
  var variables = [];
  var assets = {};
  var interval = setInterval(function () {
    var _variables$, _variables$2, _variables$3;

    if (STOP) {
      STOP = false;
      stop();
    }

    if (currLine >= lines.length - 1) {
      STOP = false;
      stop();
    }

    parseLine(lines[currLine]);
    dumpsElem.value = 'Variables:\n' + variables.reduce(function (prev, curr, i) {
      return prev + ((i === pointer ? '>' : ' ') + i++ + '. ' + (curr !== null && curr !== void 0 ? curr : '')) + '\n';
    }, '') + '\n\nArguments:\n' + (pointer == -1 ? '>' : ' ') + '-1: ' + ((_variables$ = variables[-1]) !== null && _variables$ !== void 0 ? _variables$ : '') + '\n' + (pointer == -2 ? '>' : ' ') + '-2: ' + ((_variables$2 = variables[-2]) !== null && _variables$2 !== void 0 ? _variables$2 : '') + '\n' + (pointer == -3 ? '>' : ' ') + '-3: ' + ((_variables$3 = variables[-3]) !== null && _variables$3 !== void 0 ? _variables$3 : '') + '\n\nAssets:\n' + Object.keys(assets).reduce(function (prev, curr) {
      return prev + " ".concat(curr, ": ").concat(assets[curr], "\n");
    }, '') + '\n\nLine: (' + currLine + '/' + lines.length + ')\n' + (lines[currLine].split('//')[0] || '');
    currLine++;
  }, speedElem.value);

  function parseLine(code) {
    if (code.startsWith('//') || !code) return;

    var _code$split = code.split(' '),
        _code$split2 = _toArray(_code$split),
        opcode = _code$split2[0],
        arg0 = _code$split2[1],
        args = _code$split2.slice(2);

    switch (opcode.toUpperCase()) {
      case '#ASSET':
        {
          var index = parseInt(arg0);
          var content = args.join(' ');
          if (isNaN(index) || index < 0) return panic('잘못된 문법: 유효하지 않은 에셋 주소');
          if (!content) return panic('잘못된 문법: 값이 지정되지 않음');
          assets[index] = eval(content);
          break;
        }

      case 'MOV':
        {
          var _index = parseInt(arg0);

          if (isNaN(_index)) {
            if (_index === 'nxt') pointer++;else if (_index === 'prv') pointer--;else panic('잘못된 문법: 알 수 없는 이동위치');
            return;
          }

          pointer = _index;
          break;
        }

      case 'VAL':
        {
          var _index2 = parseInt(arg0);

          if (isNaN(_index2)) {
            if (_index2 === '++') variables[pointer]++;else if (_index2 === '--') variables[pointer]--;else panic('잘못된 문법: 알 수 없는 이동위치');
            return;
          }

          variables[pointer] = _index2;
          break;
        }

      case 'CAL':
        {
          var currLib = library[variables[0]];
          if (currLib) currLib();
          break;
        }
    }
  }

  function printOut(str) {
    outputElem.value += str;
    outputElem.scrollTo(0, 9999);
  }

  function panic(msg) {
    STOP = true;
    outputElem.value += "\n\n! PANIC !\n".concat(msg);
    stop();
  }

  function stop() {
    runElem.disabled = false;
    speedElem.disabled = false;
    clearInterval(interval);
  }

  var library = {
    0: function _() {},
    1: function _() {
      return variables[variables[-2]] = variables[variables[-1]];
    },
    2: function _() {
      return variables[variables[-2]] = assets[variables[-1]];
    },
    3: function _() {
      return eval(variables[-2]);
    },
    4: function _() {
      return variables[variables[-3]] = variables[variables[-1]] == variables[variables[-2]];
    },
    5: function _() {
      return variables[variables[-3]] = variables[variables[-1]] & variables[variables[-2]];
    },
    6: function _() {
      return variables[variables[-3]] = variables[variables[-1]] | variables[variables[-2]];
    },
    7: function _() {
      return variables[variables[-2]] = !variables[variables[-1]];
    },
    8: function _() {
      return variables[variables[-3]] = variables[variables[-1]] > variables[variables[-2]];
    },
    100: function _() {
      return printOut(String.fromCharCode(variables[variables[-1]]));
    },
    101: function _() {
      return printOut(variables[variables[-1]]);
    },
    102: function _() {
      return printOut(Number(variables[variables[-1]]));
    },
    103: function _() {
      return variables[variables[-1]] = prompt(lines[currLine] + '의 의한 입력');
    },
    104: function _() {
      return variables[variables[-1]] = Number(prompt());
    }
  };
}