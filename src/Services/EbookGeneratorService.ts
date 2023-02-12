import EPUBGenerator from "epub-gen"

import {
	GenerateEPUBOptions,
	EbookConvertOptions
} from "@/Protocols/EbookGeneratorProtocol"

import ProcessCommandService from "@/Services/ProcessCommandService"

class EbookGeneratorService {
	private readonly defaultEbookConvertOptions: EbookConvertOptions = {
		authors: "Kindlefy"
	}

	async generateEPUB (filePath: string, options: GenerateEPUBOptions): Promise<string> {
		const epubParser = new EPUBGenerator(options, filePath)

		await epubParser.promise

		return filePath
	}

	async convertCBZToKindleFile (cbzFilePath: string, customOptions?: EbookConvertOptions): Promise<string> {
		return await this.convertToKindleFile(cbzFilePath, {
			...(customOptions || {}),
			noInlineToc: true,
			outputProfile: "tablet",
			right2left: false,
			landscape: true
		})
	}

	async convertEPUBToKindleFile (epubFilePath: string, customOptions?: EbookConvertOptions): Promise<string> {
		return await this.convertToKindleFile(epubFilePath, customOptions)
	}

	private async convertToKindleFile (filePath: string, customOptions?: EbookConvertOptions): Promise<string> {
		const kindleEpubFilePath = `${filePath}.epub`

		await ProcessCommandService.run("ebook-convert", [filePath, kindleEpubFilePath], {
			...(customOptions || {}),
			...this.defaultEbookConvertOptions
		})

		return kindleEpubFilePath
	}
}

export default EbookGeneratorService
