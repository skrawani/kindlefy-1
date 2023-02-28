export class ArrayParsingException extends Error {
	constructor (value: string) {
		super(`Failed to turn "${JSON.stringify(value)} ${value.slice(0, Math.floor(value.length / 2))}" into an array.`)
	}
}
