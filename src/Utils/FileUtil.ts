import mimetype from "mime-types"
import path from "path"

import { ParsedFilePath } from "@/Protocols/FileProtocol"

class FileUtil {
	getMimetypeByFileName (filename: string): string | null {
		return mimetype.lookup(filename) || null
	}

	parseFilePath (filePath: string): ParsedFilePath {
		const filename = path.basename(filePath)
		const basePath = filePath.replace(filename, "")

		const [name, extension] = filename.split(".")

		return {
			name,
			filename,
			extension,
			basePath
		}
	}
}

export default new FileUtil()
