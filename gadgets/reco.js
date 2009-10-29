function rate(radiobutton) {
	row = radiobutton.parentNode.parentNode.parentNode.parentNode;
	//row = document.getElementById("book" + rownum);
	bookcell = row.getElementsByTagName("TD")[1];
	scorecell = row.getElementsByTagName("TD")[2];
	ratingcell = row.getElementsByTagName("TD")[3];
	bookname = bookcell.textContent;
	ratingchoices = ratingcell.getElementsByTagName("FORM")[0].rating;
	ratingvalue = 0;
	if (ratingchoices.length < 1) return;
	for (i=0; i < ratingchoices.length; i++) {
		if (ratingchoices[i].checked) {
			ratingvalue = ratingchoices[i].value;
		}
	}
	scorecell.innerHTML = (ratingvalue);
	
	saveRating(bookname, ratingvalue);
}

function saveRating(name, rating) {
	log("Saving rating " + rating + " to " + name);
	books = getSavedBooks();
	index = findBookIndex(name);
	if (index != -1) {
		books[index].rating = rating;
	}
	booksstring = JSON.stringify(books);
	wave.getState().submitDelta({'books': booksstring});
	log("And books is now saved as " + wave.getState().get('books'));
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
		books = new Array();
		if (rating) {
			books[0] = {"name":bookname, "rating": rating};
		} else {
			books[0] = {"name":bookname, "rating": 0};
		}
	} else {
		//Should first check if the book already exists.
		var exists=false;
		
		if (findBook(bookname))
			exists=true;
			
		if (exists) {
			message("Duplicate addition!");
			return false;
		} else {
			if (rating) {
				books[books.length] = {"name":bookname, "rating": rating};
			} else {
				books[books.length] = {"name":bookname, "rating": 0};
			}
			booksstring = JSON.stringify(books);
			state.submitDelta({'books': booksstring});
			count = parseInt(state.get('count'));
			if (!count) {
				count = 0;
			}
			state.submitDelta({'count': count+1});
			return true;
		}
	}
	
}

function addnewbook() {
	
	newbookrow = document.getElementById("newbookentry");
	newbookname = newbookrow.getElementsByTagName("FORM")[0].newbook.value;
	if (addbookstate(newbookname)) {
		addbookrow(newbookname);
	}

	return false;
}

function findBook(name) {
	var book;
	books = getSavedBooks();
	
	return books[findBookIndex(name)];
}

function findBookIndex(name) {
	var book;
	books = getSavedBooks();
	for (i=0; i<books.length; i++) {
		if (books[i].name.toLowerCase() == name.toLowerCase()) {
			return i;
		}
	}
	return -1;
}

function getSavedBooks() {
	return eval(wave.getState().get('books'));
}

function log(msg) {
	//appendMessage("LOG:" +msg)
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
	wave.getState().submitDelta({'books': '[]' });
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
		if (books.length && books.length > 0) {
			newbookrow = document.getElementById("newbookentry");
			currcount=(newbookrow.parentNode.getElementsByTagName("TR").length - 2);
			if (books.length > currcount) {
				for (i=currcount; i<books.length; i++) {
					currrating = books[i].rating;
					if ( currrating == 0) {
						log("Calling to add withOUT rating");
						addbookrow(books[i].name);
					} else {
						log("Calling to add with rating " + currrating);
						addbookrow(books[i].name, currrating);
					}
				}
			}
		}
	}
	log("Count is " + state.get('count'));
}

gadgets.util.registerOnLoadHandler(init);
