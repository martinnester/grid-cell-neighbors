console.log('hello world!');

let db: IDBDatabase | undefined;
const request = indexedDB.open('MyTestDatabase');
request.onerror = (event) => {
	if (event.target && 'error' in event.target && event.target.error instanceof Error) {
		console.error(`Database error: ${event.target.error?.message}`);
	}
};
request.onsuccess = (event: Event) => {
	if (event.target && 'result' in event.target && event.target.result instanceof IDBDatabase) {
		db = event.target.result;
		console.log('success!');
		console.log(db);
	}
};
