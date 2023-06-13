import type { CreatorHubServer } from "#lib/Server.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import axios, { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import sharp from "sharp";
import { contentType } from "mime-types";
import FormData from "form-data";
import { HttpUrlRegex } from "@sapphire/discord-utilities";
import type { Download, Tag } from "@prisma/client";
import type { ContentType } from "#lib/constants.js";
import { Logger } from "@snowcrystals/icicle";
import { ApiError } from "#lib/errors/ApiError.js";
import { join } from "node:path";
import { writeFile, readFile, unlink } from "node:fs/promises";
import Ffmpeg from "fluent-ffmpeg";

type UploadDownload = Omit<Download, "footageId" | "id"> & { isPreview: boolean };

interface ContentCreateItem {
	name: string;

	tags: Tag[];
	type: ContentType;

	useCases: string[];
	downloads: UploadDownload[];
}

@ApplyOptions<Route.Options>({ middleware: [[methods.POST, "admin-authentication"]] })
export default class extends Route<CreatorHubServer> {
	public logger = new Logger({ name: `AdminApi#Upload(methods.POST)` });

	public async [methods.POST](req: Request<any, any, ContentCreateItem>, res: Response, next: NextFunction) {
		try {
			const { type, downloads, name, tags, useCases } = req.body;
			switch (type) {
				case "image":
					{
						const previewDownload = downloads.find((download) => download.isPreview) || downloads[0];
						const preview = await this.generateImagePreview(previewDownload.url);

						await this.server.contentManager.createContent({ name, tags, useCases, type, downloads, preview });
					}
					break;
				case "video":
					{
						const previewDownload = downloads.find((download) => download.isPreview) || downloads[0];
						const preview = await this.generateVideoPreview(previewDownload.url);

						await this.server.contentManager.createContent({ name, tags, useCases, type, downloads, preview });
					}
					break;
				case "music":
					{
						const previewDownload = downloads.find((download) => download.isPreview) || downloads[0];
						const preview = await this.generateAudioPreview(previewDownload.url);

						await this.server.contentManager.createContent({ name, tags, useCases, type, downloads, preview });
					}
					break;
			}
		} catch (err) {
			this.logger.error(err);

			const apiError = new ApiError(HttpStatusCode.InternalServerError, {
				"*": "Unable to create a new content item, please try again later."
			});
			return next(apiError);
		}

		res.send(true);
	}

	/**
	 * Creates an optimised version of provided image
	 * @param url The url to the image
	 */
	private async generateImagePreview(url: string) {
		const bufferResponse = await axios.get(url, { responseType: "arraybuffer" });
		const buffer = Buffer.from(bufferResponse.data, "binary");

		const transformer = sharp(buffer, { sequentialRead: true });
		transformer.rotate();

		const filename = url.split("/").reverse()[0];
		const type = contentType(filename);

		switch (type) {
			case "image/png":
				transformer.png({ quality: 12 });
				break;
			case "image/jpeg":
			case "image/jpg":
				transformer.jpeg({ quality: 12 });
				break;
			default:
				transformer.webp({ quality: 12 });
				break;
		}

		transformer.resize(320, 180);
		const optBuffer = await transformer.toBuffer();

		const form = new FormData();
		form.append("upload", optBuffer, filename);

		const req = await axios.post<{ url: string }>(process.env.UPLOAD_API_URL, form, {
			headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
		});

		return req.data.url.replace(HttpUrlRegex, "https://");
	}

	/**
	 * Creates a thumbnail for the provided video
	 * @param url The url to the video
	 */
	private async generateVideoPreview(url: string) {
		const filename = url.split("/").reverse()[0];
		const bufferResponse = await axios.get(url, { responseType: "arraybuffer" });
		const buffer = Buffer.from(bufferResponse.data, "binary");

		const savePathVideo = join(process.cwd(), "temp", filename);
		const savePathScreenshot = join(process.cwd(), "temp", `${filename.split(".")[0]}.png`);
		await writeFile(savePathVideo, buffer);

		const ffmpeg = Ffmpeg(savePathVideo);
		await new Promise((res) => ffmpeg.screenshot({ count: 1 }).on("end", res).on("error", res).output(savePathScreenshot).run());

		const screenshot = await readFile(savePathScreenshot);
		const transformer = sharp(screenshot, { sequentialRead: true });
		const optBuffer = await transformer.rotate().png({ quality: 12 }).resize(320, 180).toBuffer();

		const form = new FormData();
		form.append("upload", optBuffer, "preview.png");

		const req = await axios.post<{ url: string }>(process.env.UPLOAD_API_URL, form, {
			headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
		});

		await unlink(savePathScreenshot);
		await unlink(savePathVideo);

		return req.data.url.replace(HttpUrlRegex, "https://");
	}

	/**
	 * Creates a preview segment of the provided audio
	 * @param url The url to the audio
	 */
	private async generateAudioPreview(url: string) {
		const filename = url.split("/").reverse()[0];
		const bufferResponse = await axios.get(url, { responseType: "arraybuffer" });
		const buffer = Buffer.from(bufferResponse.data, "binary");

		const savePathAudio = join(process.cwd(), "temp", filename);
		const savePathPreview = join(process.cwd(), "temp", `${filename.split(".")[0]}.mp3`);
		await writeFile(savePathAudio, buffer);

		const ffmpeg = Ffmpeg(savePathAudio);
		await new Promise((res) => ffmpeg.duration(10).output(savePathPreview).on("end", res).on("err", res).run());

		const audioPreview = await readFile(savePathPreview);
		const form = new FormData();
		form.append("upload", audioPreview, "preview.mp3");

		const req = await axios.post<{ url: string }>(process.env.UPLOAD_API_URL, form, {
			headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
		});

		await unlink(savePathPreview);
		await unlink(savePathAudio);

		return req.data.url.replace(HttpUrlRegex, "https://");
	}
}
