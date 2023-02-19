import axios, { AxiosInstance } from "axios"
import { Readable } from "stream"

import { HttpOptions, RequestMethod } from "@/Protocols/HttpProtocol"

import HttpProxyService from "@/Services/HttpProxyService"

class HttpService {
	private readonly client: AxiosInstance
	private readonly options: HttpOptions

	constructor (options: HttpOptions) {
		this.options = options

		this.client = axios.create({
			baseURL: options.baseURL,
			withCredentials: true,
			headers: {
				...options?.headers,
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
			}
		})
	}

	async toBuffer (url: string): Promise<Buffer> {
		const result = await this.client.get(url, {
			responseType: "arraybuffer"
		})

		return result.data
	}

	async toString (url: string): Promise<string> {
		let data: string

		if (this.options.withProxy) {
			data = await this.withProxy(url)
		} else {
			const result = await this.client.get(url)

			data = result.data
		}

		return data
	}

	async toJSON<Result extends Record<string, unknown>>(url: string): Promise<Result> {
		let data: Result

		if (this.options.withProxy) {
			const stringData = await this.withProxy(url)

			data = JSON.parse(stringData)
		} else {
			const result = await this.client.get(url, { responseType: "json" })

			data = result.data
		}

		return data
	}

	async toReadStream (url: string): Promise<Readable> {
		const result = await this.client.get(url, {
			responseType: "stream"
		})

		return result.data
	}

	async exists (url: string): Promise<boolean> {
		try {
			await this.client.head(url)

			return true
		} catch {
			return false
		}
	}

	async makeRawRequest<Result>(method: RequestMethod, url: string, data: unknown = undefined, options?: HttpOptions): Promise<Result> {
		const response = await this.client({
			method,
			url,
			...options,
			data
		})

		return response.data
	}

	private async withProxy (url: string): Promise<string> {
		const formattedURL = new URL(url, this.options.baseURL)

		return await HttpProxyService.get(formattedURL.href)
	}
}

export default HttpService
