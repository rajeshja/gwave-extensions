var BookRecord = function(name, rating) {
	this.type = "record";
	this.name = name;
	if (rating) {
		this.rating = rating;
	}
}

var BooksType = function() {
	this.count = 0;
	this.add = function(name, rating) {
		if (!this.get(name)) {
			//Add it
			this[name.toLowerCase()] = new BookRecord(name, rating);
			this.count += 1;
		} else {
			//Already exists
			throw "Book already exists";
		}
	};

	this.get = function(name) {
		return this[name.toLowerCase()];
	}

	this.save = function(name, rating) {
		if (!this.get(name)) {
			this.add(name, rating);
		} else {
			this.get(name).rating = rating;
		}
	}
}

function rate(radiobutton) {
	row = radiobutton.parentNode.parentNode.parentNode.parentNode;
	//row = document.getElementById("book" + rownum);
	bookcell = row.getElementsByTagName("TD")[1];
	scorecell = row.getElementsByTagName("TD")[2];
	ratingcell = row.getElementsByTagName("TD")[3];
	bookname = bookcell.textContent;
	ratingform = ratingcell.getElementsByTagName("FORM")[0];
	ratingchoices = ratingform.rating;
	ratingvalue = 0;
	if (ratingchoices.length < 1) return;
	for (i=0; i < ratingchoices.length; i++) {
		if (ratingchoices[i].checked) {
			ratingvalue = ratingchoices[i].value;
		}
	}
	scorecell.innerHTML = (ratingvalue);
	
	ratingform.setAttribute("style", "display:none");

	ratingdiv = ratingcell.getElementsByTagName("DIV")[0]
	ratingdiv.innerHTML = "You chose " + ratingvalue + " <span class='rateagain' onclick='rateAgain(this)'>Change</span>";
	ratingdiv.setAttribute("style", "");

	//TODO
	saveRating(bookname, ratingvalue);
}

function saveRating(name, rating) {
	log("Saving rating " + rating + " to " + name);
	books = getSavedBooks();
	books.save(name, rating);

	booksstring = JSON.stringify(books);

	wave.getState().submitDelta({'books': booksstring});
	log("And books is now saved as " + wave.getState().get('books'));
}

function rateAgain(element) {
	ratingcell = element.parentNode.parentNode;
	ratingform = ratingcell.getElementsByTagName("FORM")[0];
	ratingform.setAttribute("style", "");
	ratingdiv = element.parentNode;
	ratingdiv.setAttribute("style", "display:none");
}

function addbookrow(bookname, rating) {
	newbookrow = document.getElementById("newbookentry");
	newcount=(newbookrow.parentNode.getElementsByTagName("TR").length - 2) + 1;

	newtr = document.getElementById("row-template").cloneNode(true);
	newtr.removeAttribute("style");
	
	//Set the Serial number
	srtd = newtr.getElementsByTagName("TD")[0];
	srtd.innerHTML = newcount;
	//Set the book name
	nametd = newtr.getElementsByTagName("TD")[1];
	nametd.innerHTML = bookname;
	//Set the tr identifier
	newtr.setAttribute("id", "book"+newcount);
	//If rating is there, set the cell to it.
	log("The rating is " + rating);
	if (rating) {
		scroretd = newtr.getElementsByTagName("TD")[2];
		scroretd.innerHTML = rating;
		//ratingtd = newtr.getElementsByTagName("TD")[3];
		//ratingtd.innerHTML = rating;
	}

	newbookrow.parentNode.insertBefore(newtr, newbookrow);

	gadgets.window.adjustHeight(280);

}

function addbookstate(bookname, rating) {
	state = wave.getState();
	log("Original books element = " + state.get('books'));
	books = getSavedBooks();
	log("Books after eval = " + books);
	if (books) {
		log("book 0 = " + books[0]);
		if (books[0]) {
			log("book 0 is " + books[0].name + ":" + books[0].rating);
		}
	}

	if (!books) {
		books = new BooksType();
	}
	if (!(books.add)) {
		books = new BooksType();
	}
	try {
		books.add(bookname, rating);
	} catch (e){
		message(e);
		return false;
	}

	booksstring = JSON.stringify(books);
	state.submitDelta({'books': booksstring});

	//Count is not required
	count = parseInt(state.get('count'));
	if (!count) {
		count = 0;
	}
	state.submitDelta({'count': count+1});
	//Count is not required

	return true;
	
}

function addnewbook() {
	
	newbookrow = document.getElementById("newbookentry");
	newbookname = newbookrow.getElementsByTagName("FORM")[0].newbook.value;
	if (addbookstate(newbookname)) {
		addbookrow(newbookname);
	}

	return false;
}

function getSavedBooks() {
	return JSON.parse(wave.getState().get('books'));
}

function log(msg) {
	appendMessage("LOG:" +msg)
}

function message(msg) {
	document.getElementById("messages").innerHTML = msg + "<br/>"; 
}

function appendMessage(msg) {
	document.getElementById("messages").innerHTML += msg + "<br/>"; 
}

function disableEnterKey(e)
{
	var key;     
	if(window.event)
		key = window.event.keyCode; //IE
	else
		key = e.which; //firefox     
	
	return (key != 13);
}

function tempClear() {
	books = new BooksType();
	wave.getState().submitDelta({'books': JSON.stringify(books) });
}

function init() {
	if (wave && wave.isInWaveContainer()) {
		wave.setStateCallback(stateUpdated);
	}
}

function stateUpdated() {
	log("State changed");
	showBookList();
}

function showBookList() {
	state = wave.getState();
	if (!state) {
		log("No state available.");
	} else if (!state.get('books')) {
		log("No books available.");
	} else {
		books = getSavedBooks();
		if (books) {
			newbookrow = document.getElementById("newbookentry");
			
			bookrows = newbookrow.parentNode.getElementsByTagName("TR");
			for (i=0; i<bookrows.length - 2; i++) {
				newbookrow.parentNode.removeChild(bookrows[i]);
			}
			
			for (record in books) {
				if (books[record].type == "record") {
					book = books[record];
					addbookrow(book.name, book.rating);
				}
			}


//			currcount=(newbookrow.parentNode.getElementsByTagName("TR").length - 2);
//			if (books.count > currcount) {
//
//				// Need to loop through
//				for (i=currcount; i<books.length; i++) {
//					currrating = books[i].rating;
//					if ( currrating == 0) {
//						log("Calling to add withOUT rating");
//						addbookrow(books[i].name);
//					} else {
//						log("Calling to add with rating " + currrating);
//						addbookrow(books[i].name, currrating);
//					}
//				}
//			}
		}
	}
	log("Count is " + state.get('count'));
}

gadgets.util.registerOnLoadHandler(init);
