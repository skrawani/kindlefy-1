import fs from "fs"

import { DocumentModel } from "@/Models/DocumentModel"

import { ConverterContract } from "@/Protocols/ConverterProtocol"
import { Content } from "@/Protocols/ImporterProtocol"
import { Manga } from "@/Protocols/MangaImporterProtocol"
import { SourceConfig } from "@/Protocols/SetupInputProtocol"

import TempFolderService from "@/Services/TempFolderService"
import QueueService from "@/Services/QueueService"
import EbookGeneratorService from "@/Services/EbookGeneratorService"
import EbookCoverService from "@/Services/EbookCoverService"

import FileUtil from "@/Utils/FileUtil"
import DataManipulationUtil from "@/Utils/DataManipulationUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"

class MangaConverterTool implements ConverterContract<Manga> {
	private readonly queueService = new QueueService({ concurrency: 5, retries: 3, retryDelay: 10000 })
	private readonly ebookGeneratorService = new EbookGeneratorService()
	private readonly ebookCoverService = new EbookCoverService()

	async convert (content: Content<Manga>): Promise<DocumentModel[]> {
		content.data.chapters = this.applySourceConfigDataManipulation(content.data.chapters, content.sourceConfig)

		const documents: DocumentModel[] = await Promise.all(
			content.data.chapters.map(async mangaChapter => (
				await this.queueService.enqueue(async () => {
					const fullChapterName = `${content.data.title} - ${mangaChapter.title}`

					const coverPath = await this.ebookCoverService.generate({
						rawCoverUrl: content.data.coverUrl,
						title: content.data.title,
						subTitle: mangaChapter.title
					})

					const chapterZipFile = await mangaChapter.getZipFile()

					const cbzFilePath = await this.pagesFileToCBZ(chapterZipFile.data, fullChapterName)

					const kindleFilePath = await this.convertToKindleFile(cbzFilePath, coverPath, fullChapterName)
					const kindleFileData = fs.createReadStream(kindleFilePath)

					const { filename } = FileUtil.parseFilePath(kindleFilePath)

					return new DocumentModel({
						title: fullChapterName,
						filename,
						data: kindleFileData,
						type: content.sourceConfig.type
					})
				})
			))
		)

		return documents
	}

	private async pagesFileToCBZ (pageFile: Buffer, title: string): Promise<string> {
		const cbzFileName = SanitizationUtil.sanitizeFilename(`${title}.cbz`)

		const cbzFilePath = await TempFolderService.mountTempPath(cbzFileName)

		await fs.promises.writeFile(cbzFilePath, pageFile)

		return cbzFilePath
	}

	private async convertToKindleFile (cbzFilePath: string, customCoverPath: string, title: string): Promise<string> {
		return await this.ebookGeneratorService.convertCBZToKindleFile(cbzFilePath, {
			cover: customCoverPath,
			title
		})
	}

	private applySourceConfigDataManipulation (data: Manga["chapters"], sourceConfig: SourceConfig): Manga["chapters"] {
		return DataManipulationUtil.manipulateArray(data, {
			order: {
				property: "no",
				type: sourceConfig?.order ?? "desc"
			},
			limit: sourceConfig.count ?? 1
		})
	}
}

export default new MangaConverterTool()
