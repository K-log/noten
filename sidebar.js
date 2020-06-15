// Constants
const storageArea = 'local'

const inputBody = document.querySelector('.new-note textarea')
const noteList = document.getElementById('note-list')

const addBtn = document.querySelector('.new-note input')

let currentEditNoteId = ''

window.onload = function() {
  displayAllNotes()
}
addBtn.addEventListener('click', addNote)

function onError(error) {
  console.log(error)
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function formatDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function resultsToSortedArray(results) {
  return Object.entries(results).sort((a, b) => a[1].sortOrder - b[1].sortOrder)
}

function displayAllNotes() {
  /*
  *  Get all notes from storage and display them in the page.
  */
  const gettingAllStorageItems = browser.storage[storageArea].get(null)
  gettingAllStorageItems.then((results) => {
    const sortedNotes = resultsToSortedArray(results)
    document.getElementById('note-list').innerHTML = ''
    for (let note of sortedNotes) {
      const [id, value] = note
      displayNote(id, value.body, value.date, value.sortOrder)
    }
  }, onError)
}

function addNote() {
  const id = uuidv4()
  const body = inputBody.value
  const date = new Date()
  const gettingItems = browser.storage[storageArea].get(null);
  gettingItems.then((results) => {
    const objTest = Object.keys(results[id] ? results[id] : {})
    if(objTest.length < 1 && id !== '' && body !== '') {
      const sortOrder = Object.keys(results).length
      inputBody.value = ''
      storeNote(id, body, date, sortOrder)
    }
  }, onError)
}

function storeNote(id, body, date, sortOrder) {
  /*
  *  Store a note.
  */
  let storingNote = browser.storage[storageArea].set({
    [id]: {
      body,
      date,
      sortOrder
    }
  });
  storingNote.then(displayAllNotes, onError)
}

function handleDeleteNote(e) {
  const evtTgt = e.target
  const id = evtTgt.dataset.id
  const note = document.getElementById(id)
  noteList.removeChild(note)
  browser.storage[storageArea].remove(id).then(() => {
    currentEditNoteId = ''
  })
}

function handleEditNote(e) {
  const id = e.target.dataset.id
  const note = document.getElementById(id)
  const body = document.getElementById(`${id}-body`)
  const gettingItem = browser.storage[storageArea].get();

  gettingItem.then((results) => {
    if(currentEditNoteId !== '') {
      // If a note is currently open for editing, close and reset it without saving
      const editNote = document.getElementById(currentEditNoteId)
      const editBody = document.getElementById(`${currentEditNoteId}-body`)
      editNote.querySelector('.edit-btn').removeAttribute('hidden')
      editNote.querySelector('.save-btn').setAttribute('hidden', 'true')
      editBody.innerHTML = marked(results[currentEditNoteId].body)
    }

    // The number of lines in the body text
    const lineCount = results[id].body.split(/\r*\n/).length
    const textArea = document.createElement('textarea')
    textArea.setAttribute('id', `${id}-edit-textarea`)

    // Only show a maximum of 10 lines
    textArea.setAttribute('rows', lineCount < 10 ? "10" : lineCount.toString())

    textArea.innerHTML = results[id].body
    body.innerHTML = ''
    body.appendChild(textArea)

    note.querySelector('.edit-btn').setAttribute('hidden', 'true')
    note.querySelector('.save-btn').removeAttribute('hidden')

    currentEditNoteId = id
  }, onError)
}

function handleSaveNote(e) {
  const id = e.target.dataset.id
  const note = document.getElementById(id)
  const gettingItem = browser.storage[storageArea].get(id)
  const textArea = document.getElementById(`${id}-edit-textarea`)

  gettingItem.then((result) => {
    storeNote(id, textArea.value, new Date(), result.sortOrder)

    note.querySelector('.save-btn').setAttribute('hidden', 'true')
    note.querySelector('.edit-btn').removeAttribute('hidden')

    currentEditNoteId = ''
  }, onError)
}

function displayNote(id, body, date, sortOrder) {
  /*
    Display create a note element and insert it into the dom in the notes list.
  */
  const note = document.createElement('div')
  const noteDate = document.createElement('div')
  const noteBody = document.createElement('div')
  const noteFooter = document.createElement('div')
  const noteBtns = document.createElement('div')
  const deleteBtn = document.createElement('button')
  const editBtn = document.createElement('button')
  const saveBtn = document.createElement('button')

  note.setAttribute('id', id)
  note.setAttribute('class','note')
  note.setAttribute('data-sortorder', sortOrder)

  noteDate.setAttribute('class', 'note-date')
  noteDate.textContent = formatDate(date)

  noteBody.setAttribute('id', `${id}-body`)
  noteBody.innerHTML = marked(body)

  noteFooter.setAttribute('class', 'note-footer')

  noteBtns.setAttribute('class', 'note-btns')

  deleteBtn.setAttribute('class','delete-btn')
  deleteBtn.setAttribute('data-id', id)
  deleteBtn.addEventListener('click', handleDeleteNote)
  deleteBtn.textContent = 'delete'

  editBtn.setAttribute('class','edit-btn')
  editBtn.setAttribute('data-id', id)
  editBtn.addEventListener('click', handleEditNote)
  editBtn.textContent = 'edit'

  saveBtn.setAttribute('class','save-btn')
  saveBtn.setAttribute('hidden','true')
  saveBtn.setAttribute('data-id', id)
  saveBtn.addEventListener('click', handleSaveNote)
  saveBtn.textContent = 'save'

  noteBtns.appendChild(deleteBtn)
  noteBtns.appendChild(editBtn)
  noteBtns.appendChild(saveBtn)

  noteFooter.appendChild(noteDate)
  noteFooter.appendChild(noteBtns)

  note.appendChild(noteBody)
  note.appendChild(noteFooter)

  noteList.prepend(note)
}