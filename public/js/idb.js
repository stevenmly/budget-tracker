let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
	const db = event.target.result;
	db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
	db = event.target.result;

	if (navigator.onLine) {
		uploadBudget();
	}
};

request.onerror = function (event) {
	console.log(event.target.errorCode);
};

function saveRecord(record) {
	const transaction = db.transaction(["new_transaction"], "readwrite");

	const transactionObjectStore = transaction.objectStore("new_transaction");

	transactionObjectStore.add(record);
}

function uploadBudget() {
	const transaction = db.transaction(["new_transaction"], "readwrite");

	const transactionObjectStore = transaction.objectStore("new_transaction");

	// get all records from store and set to a variable
	const getAll = transactionObjectStore.getAll();

	getAll.onsuccess = function () {
		// if there was data in indexedDb's store, let's send it to the api server
		if (getAll.result.length > 0) {
			fetch("/api/transaction", {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then((serverResponse) => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}

					const transaction = db.transaction(["new_transaction"], "readwrite");
					const transactionObjectStore = transaction.objectStore(
						"new_transaction"
					);
					transactionObjectStore.clear();
				})
				.catch((err) => {
					// set reference to redirect back here
					console.log(err);
				});
		}
	};
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);