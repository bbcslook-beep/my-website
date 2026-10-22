/**
 * Serializes JSON for an inline script without allowing HTML end tags to escape it.
 * @param {unknown} value
 * @returns {string}
 */
export function serializeForScript(value) {
	const json = JSON.stringify(value);
	if (json === undefined) {
		throw new TypeError("Inline script data must be JSON serializable.");
	}
	return json.replace(/</g, "\\u003c");
}
