export class ArrayParsingException extends Error {
	constructor (value: string) {
		super(`Failed to turn "${value}" into an array.`)
	}
}
