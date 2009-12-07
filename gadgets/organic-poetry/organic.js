var lastId = undefined;

var curr = undefined;

var words = {};

var canvasheight = 290;
var canvaswidth = 290;

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function Position(x, y) {
	this.left = x + "px";
	this.top = y + "px";
	this.position = "absolute";
}

function getCanvasCtx() {
	var canvas = document.getElementById('op-back');
	if (canvas.getContext) {
		return canvas.getContext('2d');
	} else {
		return undefined;
	}
}

function Word(text, location, id, type) {
	if (id) {
		this.id = id;
	} else {
		this.id = 'w' + lastId;
		lastId ++;
		wave.getState().submitDelta({'lastId' : lastId});
	}

	this.text = text;
	this.location = location;
	
	this.nextWords = [];
	this.prevWords = [];
	words[this.id] = this;
	wave.getState().submitDelta({(this.id) : wave.util.printJson(this)});

	this.addPrev = addPrev;
	this.addNext = addNext;
	this.removePrev = removePrev;
	this.removeNext = removeNext;

	if (type) {
		this.type = type;
	}

}

function addPrev(prev) {
	this.prevWords[this.prevWords.length] = prev;
}
function addNext(next) {
	this.nextWords[this.nextWords.length] = next;
}
function removePrev(word) {
	for (var i=0; i<this.prevWords.length; i++) {
		if (word.id == this.prevWords[i].id) {
			this.prevWords.splice(i, 1);
		}
	}
}
function removeNext(word) {
	for (var i=0; i<this.nextWords.length; i++) {
		if (word.id == this.nextWords[i].id) {
			this.nextWords.splice(i, 1);
		}
	}
}

function drawLine(frompos, topos) {
	var ctx = getCanvasCtx();
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.moveTo(frompos.x+5, frompos.y+5);
	ctx.lineTo(topos.x+5, topos.y+5);
	ctx.stroke();
}

function clearLine(frompos, topos) {
	var ctx = getCanvasCtx();

	var x = frompos.x<topos.x ? frompos.x : topos.x;
	var y = frompos.y<topos.y ? frompos.y : topos.y;
	var w = frompos.x<topos.x ? topos.x-frompos.x : frompos.x-topos.x;
	var h = frompos.y<topos.y ? topos.y-frompos.y : frompos.y-topos.y;

	ctx.clearRect(x+3, y+3, w+2, h+2);
}

function drawWord(word) {
	var w;
	//Checking for $("#"+word.id) retrieves an object.
	//Need to read more about $().
	if (!document.getElementById(word.id)) {
		var worddiv = '<div id="' + word.id + '" class="word">' +
			word.text +
			'</div>';
		w = $(worddiv);
		w.draggable({start: recordStartPoint, stop: redrawConnectors});
		w.click(makeCurrent);
		$("#organic-poetry").append(w);
	} else {
		w = $(word.id);
	}
		
	w.css(new Position(word.location.x, word.location.y));
}

function redrawFrom(w) {
	drawWord(w);

	for (var i=0; i<w.nextWords.length; i++) {
		var nextWord = w.nextWords[i];
		drawLine(w.location, nextWord.location);
		redrawFrom(nextWord);
	}
}

function recordStartPoint(e, ui) {
	var w = words[this.id];
	var pos = $(this).position();
	w.oldPos = new Point(pos.left, pos.top);
}

function redrawConnectors(e, ui) {
	var w = words[this.id];
	var pos = $(this).position();
	w.location = new Point(pos.left, pos.top);
	
	for (var i=0; i<w.prevWords.length; i++) {
		var prevWord = w.prevWords[i];
		clearLine(prevWord.location, w.oldPos);
	}
	for (var i=0; i<w.nextWords.length; i++) {
		var nextWord = w.nextWords[i];
		clearLine(w.oldPos, nextWord.location);
	}
	for (var i=0; i<w.prevWords.length; i++) {
		var prevWord = w.prevWords[i];
		drawLine(prevWord.location, w.location);
	}
	for (var i=0; i<w.nextWords.length; i++) {
		var nextWord = w.nextWords[i];
		drawLine(w.location, nextWord.location);
	}
}

function resizeCanvas(e, ui) {
	var canvas = document.getElementById('op-back');
	canvas.setAttribute("height", ui.size.height-5);
	canvasheight = ui.size.height-5;
	canvas.setAttribute("width", ui.size.width-5);
	canvaswidth = ui.size.width-5;

	redrawFrom(words["start-node"]);
}

function makeCurrent(e) {
	if (curr) {
		$("#"+curr.id).removeClass("selected");
	}
	curr = words[this.id];
	wave.getState().submitDelta({'curr' : wave.util.printJson(curr)});
	$(this).addClass("selected");
}

function updateCurrent(word) {
	if (curr) {
		$("#"+curr.id).removeClass("selected");
	}
	curr = word;
	wave.getState().submitDelta({'curr' : wave.util.printJson(curr)});
	$("#"+word.id).addClass("selected");
}

function addWords(e) {
	if ((curr.id == "start-node")
		&& (curr.nextWords.length != 0)) {
		return;
	}

	var entered = $("#newWord").val().split(" ");

	for(i=0; i<entered.length; i++) {
		if (entered[i] && (entered[i].length>0)) {
			var n = new Word(entered[i],
							 new Point(curr.location.x, curr.location.y+20));
			n.addPrev(curr);
			curr.addNext(n);
			drawWord(n);
			drawLine(curr.location, n.location);
			updateCurrent(n);
		}
	}
}

function deleteSelected(e) {
	if (curr && (curr.id != "start-node")) {
		deleteSubTree(curr);
		curr = undefined;
	}
	var canvas = document.getElementById('op-back');
	canvas.setAttribute("width", canvaswidth);
	redrawFrom(words["start-node"]);
}

function deleteSubTree(word) {
	$("#"+word.id).remove();

	for (var i=0; i<word.prevWords.length; i++) {
		var prevWord = word.prevWords[i];
		clearLine(prevWord.location, word.location);
		prevWord.removeNext(word);
		word.removePrev(prevWord);
	}
	for (var i=0; i<word.nextWords.length; i++) {
		var nextWord = word.nextWords[i];
		deleteSubTree(nextWord);
		i--;
	}
	
	words[word.id] = undefined;
}

/*
 * This function should be called on first load of the gadget.
 * This should setup initial state of elements if not already set.
 *
 */
function setup() {

	//Setup last Id.
	if (!lastId) {
		lastStored = wave.getState().get('lastId');
		if (lastStored) {
			lastId = parseInt(lastStored);
		} else {
			lastId = 1;
		}
	}

	//Setup curr.
	if (!curr) {
		currStored = wave.getState().get('curr');
		if (currStored) {
		}

	root = $("#organic-poetry");
	root.resizable({stop: resizeCanvas});
	var canvas = document.getElementById('op-back');
	canvas.setAttribute("height", root.height()-5);
	canvas.setAttribute("width", root.width()-5);

	$("#add").click(addWords);
	$("#delete").click(deleteSelected);
	
	var s = new Word("Start", new Point(10,10), "start-node", "start");
	drawWord(s);
	updateCurrent(s);
}

function stateUpdated() {
	
}

function init() {
	if (wave && wave.isInWaveContainer()) {
		wave.setStateCallback(stateUpdated);
	}
}

gadgets.util.registerOnLoadHandler(init);
