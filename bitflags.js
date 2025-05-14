function bitFlags(number = 0, jsonEnum = {}) {
	const jsonKeys = Object.keys(jsonEnum);
	let returnJson = {};
	for (let i = 1, i1 = 0; i < Math.max(number + 1, 256); i += i, i1++) {
		if (jsonKeys[i1]) {
			returnJson[i] = returnJson[jsonKeys[i1]] = ((number & i) != 0);
		} else {
			returnJson[i] = returnJson[`UNUSED_${i1 + 1}`] = ((number & i) != 0);
		}
	}
	
	return returnJson;
}

module.exports = bitFlags;