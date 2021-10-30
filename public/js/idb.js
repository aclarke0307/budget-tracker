// create variable to hold db connection
let db;

// establish a connection to IndexDB database called 'budget_tracker' ans set it to version 1
const request = indexedDB.open('budget_tracker', 1);

//event will emit if the datbase version changes 
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    // create an onject store (table) called 'new_tracker', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_tracker', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store or established a connection, save reference to db in global variable
    db = event.target.result;
    
    // check if app is online, if yes run uploadTracker() fucntion to send all local db data to api
    if(navigator.onLine) {
        uploadTracker();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

// function will execute if we attempt to submit a new budget and there is no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write premissions
    const transaction = db.transaction(['new_tracker'], 'readwrite');
    
    // access the object store for 'new_tracker'
    const budgetObjectStore = transaction.objectStore('new_tracker');

    // add record to your store with add method
    budgetObjectStore.add(record);
};

function uploadTracker() {
    // open a transaction on your db
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_tracker');

    //get all records from store and set to a variable 
    const getAll = budgetObjectStore.getAll();

    //upon a successful .getAll() exexution, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_tracker'], 'readwrite');
                //access the new_tracker object store
                const budgetObjectStore = transaction.objectStore('new_tracker');
                // clear all items in store
                budgetObjectStore.clear();

                alert('All saved transaction has been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', uploadTracker);