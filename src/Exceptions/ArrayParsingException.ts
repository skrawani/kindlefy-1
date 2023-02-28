export class ArrayParsingException extends Error {
	constructor (value: string) {
		super(`Failed to turn "${value} ${value.slice(0, Math.floor(value.length / 2))} ${value.slice(Math.floor(value.length / 2), value.length)}" into an array.`)
	}
}
