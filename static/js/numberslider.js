/* 
	@author zz85
	balloon toolbars and value sliders for numbers
	idea motivated by http://vimeo.com/36579366
*/

var div = document.createElement('div');

function createElementOfId(id) {
	var e = div.cloneNode(false);
	e.id = id;
	return e;
}

var bubble = createElementOfId('bubble');
var vtrack = createElementOfId('vtrack');
var track = createElementOfId('track');
var bubble = createElementOfId('bubble');
var lslider = createElementOfId('lslider');
var rslider = createElementOfId('rslider');
var isBalloonOpen = false;

lslider.className = 'slider';
rslider.className = 'slider';
vtrack.appendChild(lslider);
vtrack.appendChild(rslider);
vtrack.appendChild(track);
bubble.appendChild(vtrack);

var bubbleParent = code.getWrapperElement();
bubbleParent.appendChild(bubble);

/*
The above creates something like
<div id="bubble" class="bubble">
  <div id="vtrack" class="vtrack">
    <div id="lslider" class="lslider"></div>
    <div id="rslider" class="rslider"></div>
    <div id="track" class="track"></div>
  </div>
</div>
*/

var trackWidth = parseInt(track.clientWidth, 0);
var halfWidth = trackWidth/2;

var target;
var current, currentString;
var isFloat;
var token;
var startPos;
var endPos;
var cursor;

bubble.className = 'hideBubble';

function onMouseMove(e) {
  if (!isBalloonOpen) {
	return true;
  }

  var x = e.clientX; // this might come in useful later for out of bubble drags
  var y = e.clientY;
  
  var rect = vtrack.getBoundingClientRect();
  var offsetX = x - rect.left;
  var offsetY = y - rect.top;

  var val = offsetX - halfWidth;
  if (val > 0) {
    rslider.style.width = val + 'px';
    lslider.style.width = 0;
  } else {
    lslider.style.width = -val + 'px';
    rslider.style.width = 0;
  }
  
  var result;
  
  if (isFloat) {
    // result = current + val * 0.01;

    var sign = (val > 0) ? 1 : -1;
    var rate = Math.min(Math.max(Math.log(Math.abs(current)) * 0.0052, 0.007), 1);
    var mag = Math.abs(val);
    result = current - sign + sign * Math.pow(10.0, rate * mag);
    interactiveUniform = result;
    result = result.toFixed(2);
  } else {
    result = current + Math.round(val);
  }
  
  //target.innerHTML = result;
  // console.log('result', result);

  var oldLength = endPos.ch - startPos.ch;
  var newLength = result.toString().length;

  code.replaceRange(result.toString(), startPos, endPos);
  endPos.ch += newLength - oldLength;
  // code.setCursor(cursor);
  //debug.innerHTML = '(' + offsetX + ',' + offsetY + ')';


  return false;

}

var selfDestructBalloon;
vtrack.onmousemove = onMouseMove;
vtrack.onclick = deactivateBalloon;
vtrack.onmouseout = function() {
	if (isBalloonOpen) {
		isBalloonOpen = false;
		selfDestructBalloon = setTimeout(cancelBalloon, 800 );
		bubble.className = 'animateBubble fadeBubble';
	}
};

vtrack.onmouseover = function() {
	if (selfDestructBalloon) {
		clearTimeout(selfDestructBalloon);
		bubble.className = 'animateBubble showBubble';
		isBalloonOpen = true;
		selfDestructBalloon = 0;
	}
};

function deactivateBalloon() {
	isBalloonOpen = false;
	if (selfDestructBalloon) {
		clearTimeout(selfDestructBalloon);
		selfDestructBalloon = 0;
	}
	bubble.className = 'hideBubble';
	endInteractiveUniform();
}

function cancelBalloon() {
	var oldLength = endPos.ch - startPos.ch;
	var newLength = currentString.length;

	code.replaceRange(currentString, startPos, endPos);
	endPos.ch += newLength - oldLength;
	deactivateBalloon();
}

function startInteractiveUniform() {
	if (!useSandboxInteractiveUniform) {
		useSandboxInteractiveUniform = true;
		compileOnChangeCode = false;
		interactiveUniform = current;
		
		var uniformName = 'temp_sandbox_slider';
		var oldLength = endPos.ch - startPos.ch;
		var newLength = uniformName.length;

		code.replaceRange(uniformName, startPos, endPos);
		endPos.ch += newLength - oldLength;
		
		interactiveUniformCode = code.getValue();
		var pos = interactiveUniformCode.indexOf('uniform');
		if (pos < 0) {
			pos = 0;
		}
		interactiveUniformCode = interactiveUniformCode.substring(0, pos) + "uniform " +
			(isFloat ? "float " : "int ") + uniformName + ";" +
			interactiveUniformCode.substring(pos);
		
		oldLength = endPos.ch - startPos.ch;
		newLength = currentString.length;

		code.replaceRange(currentString, startPos, endPos);
		endPos.ch += newLength - oldLength;

		compile();
	}
}

function endInteractiveUniform() {
	if (useSandboxInteractiveUniform) {
		useSandboxInteractiveUniform = false;
		interactiveUniformCode = "";
		compileOnChangeCode = true;
		compile();
	}
}

function activateBalloon() {

		isBalloonOpen = true;
		bubble.className = 'showBubble animateBubble';

		currentString = token.string;
		
		lslider.style.width = 0;
		rslider.style.width = 0;

		startPos = {
			line: cursor.line,
			ch: token.start
		};
		
		endPos = {
			line: cursor.line,
			ch: token.end
		};

		repositionBalloon();

		if ( isFloat = currentString.indexOf('.')>-1 ) {
			current = parseFloat(currentString);
		} else {
			current = parseInt(currentString, 0);
		}
		startInteractiveUniform();
}

function repositionBalloon() {

		var startCoords = code.charCoords(startPos);
		var endCoords = code.charCoords(endPos);
		var atCoords =  {x: (startCoords.x + endCoords.x)/2, y: startCoords.y };
		
		// var atCoords = code.charCoords(cursor);

		// Position Bubble
		var rect = bubbleParent.getBoundingClientRect();
		bubble.style.left = (atCoords.x - rect.left) + 'px';
		bubble.style.top = (atCoords.y - 2 - rect.top)+ 'px';

}

// we need to plug into codeMirror
var s = code.getScrollerElement();
var isDecimal = /(\+|\-)?((\d+[\.]\d+)|([\.]\d+)|(\d+[\.])|(\d+))/g;
var isOperatorChar = /[+\-*&%=<>!?|\/,{}]/;

s.addEventListener('mousedown', function(e) {

	var oldToken = token;
	token = null;

	cursor = code.coordsChar({x: e.clientX, y: e.clientY});
	console.log(cursor);
	// extract the line of the cursor
	var lineText = code.getLine(cursor.line); 
	
	// extract text before and after cursor in the line
	var beforeCh = lineText.substring(0, cursor.ch);
	var afterCh = lineText.substring(cursor.ch);
	
	// trim the start and the front to the nearest whitespaces
	var cursorInToken = beforeCh.split('').reverse().join('').search(/\s/);
	var start = beforeCh.length - cursorInToken;
	if (start>-1) beforeCh = beforeCh.substring(start, beforeCh.length);
	var end = afterCh.search(/\s/);
	if (end>-1) afterCh = afterCh.substring(0, end);

	// combine both ends to give the token around cursor
	var tokenWord = beforeCh + afterCh;

	var matchedPosition = -1;
	var isCursorAtNumber = false;

	var endMatch;
	var match;
	
	while ((match = isDecimal.exec(tokenWord))!= null) {

		console.log('match', match, 'at', match.index);
		matchedPosition = match.index;
		endMatch = match[0].length + matchedPosition;

		if ( matchedPosition <= cursorInToken && endMatch >= cursorInToken ) {
			
			// really found
			isCursorAtNumber = true;
			console.log('we matched', match[0], matchedPosition, endMatch);
			break;

		}

	}

	// check boundaries
	if (isCursorAtNumber && matchedPosition>0) {
		console.log('ho', matchedPosition);
		if (!isOperatorChar.test(tokenWord[matchedPosition-1])) {
			isCursorAtNumber = false;
			console.log('no chance');
		} else {
			console.log('one more chance');
		}

	}

	if (isCursorAtNumber) {
		

		var trueMatch = tokenWord.substring(matchedPosition, endMatch - matchedPosition);
		console.log('true match', trueMatch);

		token = {
			className: 'number',
			start: matchedPosition + cursor.ch - cursorInToken,
			end: endMatch + cursor.ch - cursorInToken,
			string: trueMatch
		};

		console.log('token', token);
		var token2 = code.getTokenAt(cursor);
		console.log('compare', token2);

		console.log('verify match.', lineText.substring(token.start, token.end) );
	}

	console.log('search', matchedPosition);
	console.log('combined', tokenWord);

	


	// Activated from Mouse click
	if (isCursorAtNumber) {
		if (isBalloonOpen) {
			if (oldToken && (oldToken.start==token.start)) {
				return;
			}
		}
		activateBalloon();
	} else {
		deactivateBalloon();
	}
});


code.getInputField().addEventListener('keydown', function(e) {
	// Right now deactivate balloon on keypress.
	deactivateBalloon();

	// Keypresses handling still a little buggy below.

	// var oldToken = token;

	// cursor = code.getCursor();
	// token = code.getTokenAt(cursor);

	// if (token.className === "number") {
	// 	if (isBalloonOpen) {
	// 		if (oldToken && (oldToken.start==token.start)) {
	// 			return;
	// 		}
	// 	}
	// 	activateBalloon();

	// } else {

	// 	deactivateBalloon();

	// }

});


// We should not use this, because the API doesn't give 
// sufficient data on the event source.
// code.setOption("onCursorActivity", cursorUpdate);