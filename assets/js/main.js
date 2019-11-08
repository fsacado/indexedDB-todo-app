// SET UPS

let addInput = document.querySelector('#addInput'); // input
let tasksContainer = document.querySelector('#tasksContainer'); // main container
let itemNumber = document.querySelector('#itemNumber'); // main container
let statusButtons = document.querySelector('#statusButtons');

// Opening Indexed DB and creating a tasks store
let dbPromise = idb.open('to-do-app', 1, function (db) {
    if (!db.objectStoreNames.contains('tasks')) {
        let tasks = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true
        });
    }
});


//  CREATE

// creates html elements and show them
function createHTMLElements(task, idLastItem, completedStatus) {
    // creating new elements
    let spanContainer = document.createElement('span');
    spanContainer.setAttribute('id', 'spanContainer');
    spanContainer.setAttribute('data-number', idLastItem);
    let spanText = document.createElement('p');
    spanText.setAttribute('class', 'spanText');
    let checkboxInput = document.createElement('input');
    checkboxInput.setAttribute('class', 'check');
    checkboxInput.setAttribute('type', 'checkbox');
    checkboxInput.checked = completedStatus;

    if (completedStatus) {
        spanText.className += ' completed';
    }

    let closingX = document.createElement('span');
    closingX.setAttribute('class', 'closingX');
    closingX.textContent = 'X';

    let test = document.createTextNode(task);
    spanText.appendChild(checkboxInput); // append checkbox
    spanText.appendChild(test); // retrieve the task we just stored inside local storage
    spanText.appendChild(closingX); // append the cross

    spanContainer.appendChild(spanText);
    tasksContainer.appendChild(spanContainer);

}

// stores tasks inside indexed db
function store(task) {
    dbPromise
        .then(function (db) {
            let tx = db.transaction('tasks', 'readwrite');
            let store = tx.objectStore('tasks');
            store.put({
                task,
                'completed': false
            });
            return tx.complete;
        })
}

// when pressing keys on the input
addInput.addEventListener('keydown', function (e) {

    let addInputValue = addInput.value; // input value

    // if pressing enter AND if there's a value inside the input
    if (e.keyCode == 13 && addInputValue) {
        store(addInputValue); // store the task inside local storage
        tasksContainer.innerHTML = ""; // empty the div
        onReload();
        addInput.value = ''; // empty the input
        return;
    }
});


// ON RELOAD

// show tasks from indexed db when we reload the page
function onReload() {
    dbPromise
        .then(function (db) {
            let tx = db.transaction('tasks', 'readonly');
            let store = tx.objectStore('tasks');
            return store.getAll();
        })
        .then(function (data) {
            itemNumber.innerHTML = "";
            statusButtons.innerHTML = "";
            //  if there is at least one task show item number and status buttons
            if (data.length > 0) {
                itemNumber.innerHTML = data.length + ' item(s)';

                // generating buttons
                for (i = 0; i < 3; i++) {
                    let statusButton = document.createElement('button');
                    statusButton.setAttribute('class', 'btn');
                    switch (i) {
                        case i = 0:
                            text = 'all';
                            id = 'buttonAll';
                            break;
                        case i = 1:
                            text = 'active';
                            id = 'buttonActive';
                            break;
                        case i = 2:
                            text = 'completed';
                            id = 'buttonCompleted';
                            break;
                    }
                    statusButton.innerHTML = text;
                    statusButton.setAttribute('id', id);
                    statusButtons.appendChild(statusButton);
                }
            }
            return data.forEach(function (object) {
                completedStatus = false;
                if (object.completed == true) {
                    completedStatus = true;
                }
                createHTMLElements(object.task, object.id, completedStatus);
            });
        });
}

onReload();


// DELETE

$(document).on('click', '.closingX', function () {
    let taskId = $(this).parent().parent().attr('data-number');

    dbPromise
        .then(function (db) {
            let tx = db.transaction('tasks', 'readwrite');
            let store = tx.objectStore('tasks');
            store.delete(parseInt(taskId));
            return tx.complete;
        })
        .then(function () {
            tasksContainer.innerHTML = "";
            onReload();
        });
});


// CHECKBOX

// getting the object from indexed db and rewrite its completed status
function changeCompleteStatus(id, complete = false) {
    dbPromise
        .then(function (db) {
            let tx = db.transaction('tasks', 'readonly');
            let store = tx.objectStore('tasks');
            return store.get(id);
        })
        .then(function (data) {
            dbPromise
                .then(function (db) {
                    let tx = db.transaction('tasks', 'readwrite');
                    let store = tx.objectStore('tasks');
                    store.put({
                        task: data.task,
                        completed: complete,
                        id: data.id,
                    });
                    return tx.completed;
                });
        });
}

$(document).on('click', '.check', function () {
    // getting task id trough data-number
    let taskId = parseInt($(this).parent().parent().attr('data-number'));
    // if checkbox is checked set the complete status to true
    if ($(this).prop('checked') == true) {
        changeCompleteStatus(taskId, true);
        $(this).parent().addClass('completed');
    } else { // otherwise set it to false
        changeCompleteStatus(taskId);
        $(this).parent().removeClass('completed');
    }
});


// BUTTONS

function getsAllFromIndexedDB() {
    tasksContainer.innerHTML = "";
    return dbPromise
        .then(function (db) {
            let tx = db.transaction('tasks', 'readonly');
            let store = tx.objectStore('tasks');
            return store.getAll();
        });
}

// button all
$(document).on('click', '#buttonAll', function () {
    getsAllFromIndexedDB()
        .then(function (data) {
            data.forEach(function (object) {
                createHTMLElements(object.task, object.id, object.completed);
            })
        })
});

// button active
$(document).on('click', '#buttonActive', function () {
    tasksContainer.innerHTML = "";
    getsAllFromIndexedDB()
        .then(function (data) {
            data.forEach(function (object) {
                if (object.completed == false) {
                    createHTMLElements(object.task, object.id, object.completed);
                }
            })
        })
});

// button completed
$(document).on('click', '#buttonCompleted', function () {
    tasksContainer.innerHTML = "";
    getsAllFromIndexedDB()
        .then(function (data) {
            data.forEach(function (object) {
                if (object.completed == true) {
                    createHTMLElements(object.task, object.id, object.completed);
                }
            })
        })
});