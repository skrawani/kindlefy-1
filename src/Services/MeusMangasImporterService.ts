import fs from "fs"

import {
	MangaSearchResult,
	MangaChapterSearchResult,
	Manga,
	MangaImporterContract
} from "@/Protocols/MangaImporterProtocol"
import { MeusMangasSearchResult, RawChapter, RawChapterPicture } from "@/Protocols/MeusMangasProtocol"

import HttpService from "@/Services/HttpService"
import CrawlerService from "@/Services/CrawlerService"
import CompressionService from "@/Services/CompressionService"
import TempFolderService from "@/Services/TempFolderService"

import FileUtil from "@/Utils/FileUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"

class MeusMangasImporterService implements MangaImporterContract {
	private readonly httpService: HttpService
	private readonly websiteBaseURL = "https://seemangas.com"

	constructor () {
		this.httpService = new HttpService({
			baseURL: this.websiteBaseURL
		})
	}

	async getManga (name: string): Promise<Manga> {
		const manga = await this.searchManga(name)

		const mangaChapters = await this.searchMangaChapters(manga)

		return {
			title: manga.title,
			chapters: mangaChapters,
			coverUrl: manga.coverUrl
		}
	}

	private async searchManga (name: string): Promise<MangaSearchResult> {
		const json = await this.httpService.toJSON<Record<string, MeusMangasSearchResult>>(`wp-json/site/search/?keyword=${name}&nonce=e154db27c2`)

		const [manga] = Object.values(json)

		const mangaPath = manga.url.replace(this.websiteBaseURL, "")

		return {
			title: manga.title,
			path: mangaPath,
			coverUrl: manga.img
		}
	}

	private async searchMangaChapters (manga: MangaSearchResult): Promise<MangaChapterSearchResult[]> {
		const rawChapters = await this.getRawChaptersByMangaPath(manga.path)

		const mangaSlug = this.turnMangaTitleIntoMangaSlug(manga.title)

		const chapters: MangaChapterSearchResult[] = rawChapters.map(rawChapter => {
			const title = `Chapter ${rawChapter.no}`
			const no = rawChapter.no
			const createdAt = rawChapter.date

			return {
				createdAt,
				no,
				title,
				getPagesFile: async () => {
					const rawChapterPictures = await this.getRawChapterPictures(mangaSlug, no)

					const compressionService = new CompressionService()

					const pagesFileName = SanitizationUtil.sanitizeFilename(`${mangaSlug}-${no}.zip`)
					const pagesFilePath = await TempFolderService.mountTempPath(pagesFileName)

					const pagesFileStream = fs.createWriteStream(pagesFilePath)

					compressionService.pipe(pagesFileStream)

					const httpService = new HttpService({})

					await Promise.all(
						rawChapterPictures.map(async rawChapterPicture => {
							const rawChapterPictureReadStream = await httpService.toReadStream(rawChapterPicture.url)

							const { filename } = FileUtil.parseFilePath(rawChapterPicture.url)

							compressionService.addFile({ data: rawChapterPictureReadStream, fileName: filename })
						})
					)

					await compressionService.compress()

					const pagesFile = await fs.promises.readFile(pagesFilePath)

					return pagesFile
				}
			}
		})

		return chapters
	}

	private async getRawChaptersByMangaPath (mangaPath: string): Promise<RawChapter[]> {
		const html = await this.httpService.toString(mangaPath)

		const rawChapters: RawChapter[] = []

		const chapterListElements = CrawlerService.findElements({
			html,
			selector: "#chapter-list > div.list-load > ul > li > a"
		})

		chapterListElements.forEach(chapterListElement => {
			const chapterTitleElement = CrawlerService.getElementByClassName(chapterListElement, "cap-text")
			const chapterDateElement = CrawlerService.getElementByClassName(chapterListElement, "chapter-date")

			const chapterNumber = parseInt(chapterTitleElement.lastChild.data)
			const chapterDate = chapterDateElement.lastChild.data

			const chapterUrl = chapterListElement.attribs.href
			const chapterPath = chapterUrl.replace(this.websiteBaseURL, "")

			if (chapterNumber) {
				rawChapters.push({
					no: chapterNumber,
					date: chapterDate,
					path: chapterPath
				})
			}
		})

		return rawChapters
	}

	private async getRawChapterPictures (mangaSlug: string, chapterNo: number): Promise<RawChapterPicture[]> {
		let foundAllPictures = false
		let currentChapterPictureOrder = 1

		const rawChapterPictures: RawChapterPicture[] = []

		const cdnUrl = "https://img.seemangas.com"
		const cdnHttpService = new HttpService({ baseURL: cdnUrl })

		while (!foundAllPictures) {
			const possibleChapterPicturePaths = this.buildPossibleChapterPicturePaths(mangaSlug, chapterNo, currentChapterPictureOrder)

			const picturePathLookups = await Promise.all(
				possibleChapterPicturePaths.map(async posibleChapterPicturePath => {
					const pictureExists = await cdnHttpService.exists(posibleChapterPicturePath)

					if (pictureExists) {
						return posibleChapterPicturePath
					}
				})
			)

			const validPicturePath = picturePathLookups.find(path => path)

			if (validPicturePath) {
				rawChapterPictures.push({
					url: `${cdnUrl}/${validPicturePath}`,
					order: currentChapterPictureOrder
				})

				currentChapterPictureOrder++
			} else {
				foundAllPictures = true
			}
		}

		return rawChapterPictures
	}

	private buildPossibleChapterPicturePaths (mangaSlug: string, chapterNo: number, currentChapterPictureOrder: number): string[] {
		const possibleChapterPicturePaths: string[] = [
			`image/${mangaSlug}/${chapterNo}/${currentChapterPictureOrder}.jpg`,
			`image/${mangaSlug}/${chapterNo}/${currentChapterPictureOrder}.png`
		]

		const isSmallChapterPictureNo = String(currentChapterPictureOrder).length === 1

		if (isSmallChapterPictureNo) {
			possibleChapterPicturePaths.push(
				`image/${mangaSlug}/${chapterNo}/0${currentChapterPictureOrder}.jpg`,
				`image/${mangaSlug}/${chapterNo}/0${currentChapterPictureOrder}.png`
			)
		}

		return possibleChapterPicturePaths
	}
	
	private turnMangaTitleIntoMangaSlug (mangaTitle: string): string {
		return mangaTitle?.toLowerCase()?.replace(/ /g, "-")
	}
}

export default new MeusMangasImporterService()
