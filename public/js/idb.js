let db;
// establish a connection to IndexedDB database
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
	// save a reference to the database 
	const db = event.target.result;
	// create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts
	db.createObjectStore("new_record", { autoIncrement: true });
};

request.onsuccess = function (event) {
	db = event.target.result;

	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = function (event) {
	console.log(event.target.errorCode);
};

function saveRecord(record) {
	const transaction = db.transaction(["new_record"], "readwrite");

	const budgetObjectStore = transaction.objectStore("new_record");

	budgetObjectStore.add(record);
}

function checkDatabase() {
    // open a transaction on your db
    const transaction = db.transaction(['new_record'], 'readwrite');
  
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_record');
  
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              // open one more transaction
              const transaction = db.transaction(['new_record'], 'readwrite');
              // access the new_record object store
              const budgetObjectStore = transaction.objectStore('new_record');
              // clear all items in your store
              budgetObjectStore.clear();
    
              alert('All saved data has been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
      };
  }

// listen for app coming back online
window.addEventListener("online", uploadTransaction);