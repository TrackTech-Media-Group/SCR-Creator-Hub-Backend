import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { join } from "path";
import { writeFile, readFile } from "node:fs/promises";
import axios from "axios";
import Ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";
config({ path: join(process.cwd(), "data", ".env") });

// void (async () => {
// 	const prisma = new PrismaClient();
// 	await prisma.$connect();

// 	const footageRaw = await prisma.footage.findMany({ include: { downloads: true } });
// 	const footage = footageRaw.filter((f) => !f.preview?.length);

// 	for await (const item of footage) {
// 		console.log(`Running for ${item.name} (${footage.indexOf(item) + 1}/${footage.length})`);
// 		const download = item.downloads.find((d) => d.name.includes("HD")) || item.downloads[0];

// 		try {
// 			console.log(`Downloading the image...`);
// 			const { data: image } = await axios.get<Buffer>(download.url, { responseType: "arraybuffer" });
// 			const transformer = sharp(image, { sequentialRead: true });
// 			transformer.rotate();

// 			switch (download.url.split(".").reverse()[0]) {
// 				case "png":
// 					transformer.png({ quality: 12 });
// 					break;
// 				case "jpg":
// 				case "jpeg":
// 					transformer.jpeg({ quality: 12 });
// 					break;
// 				case "webp":
// 					transformer.webp({ quality: 12 });
// 					break;
// 				default:
// 					console.log(`Item is not an image, skipping...`);
// 					continue;
// 			}

// 			transformer.resize(320, 180);
// 			console.log(`Downloaded the image, optimising...`);
// 			const optBuffer = await transformer.toBuffer();
// 			console.log(`Optimising complete, uploading...`);

// 			const form = new FormData();
// 			form.append("upload", optBuffer, `optimised.${download.url.split(".").reverse()[0]}`);

// 			const req = await axios<{ url: string }>(`${process.env.UPLOAD_API}/api/upload`, {
// 				data: form,
// 				method: "POST",
// 				headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
// 			});

// 			console.log(`Upload completed, editing config...`);
// 			await prisma.footage.update({ where: { id: item.id }, data: { preview: req.data.url.replace("http://", "https://") } });
// 			console.log(`Continuing with next item`);
// 		} catch (err) {
// 			console.error(err);
// 			console.log(`Failed to optimise ${item.name} (${footage.indexOf(item) + 1}/${footage.length})`);
// 		}
// 	}
// })();

// void (async () => {
// 	const prisma = new PrismaClient();
// 	await prisma.$connect();

// 	const footage = await prisma.footage.findMany({ select: { tagIds: true, useCases: true, id: true } });
// 	const parsedFootage = footage.map((item) => ({
// 		...item,
// 		tagIds: item.tagIds.replace("}", "").replace("{", "").replaceAll('"', "").split(","),
// 		useCases: item.useCases.replace("}", "").replace("{", "").replaceAll('"', "").split(",")
// 	}));

// 	await writeFile(join(process.cwd(), "data", "converted.json"), JSON.stringify(parsedFootage));
// })();

// void (async () => {
// 	const prisma = new PrismaClient();
// 	await prisma.$connect();

// 	const file = await readFile(join(process.cwd(), "data", "converted.json"), "utf-8");
// 	const json = JSON.parse(file) as { id: string; tagIds: string[]; useCases: string[] }[];

// 	for await (const file of json) {
// 		await prisma.footage.update({ where: { id: file.id }, data: { tagIds: file.tagIds, useCases: file.useCases } });
// 	}

// 	const downloads = await prisma.download.findMany();
// 	for await (const download of downloads) {
// 		await prisma.download.update({ where: { id: download.id }, data: { url: download.url.replace("http://", "https://") } });
// 	}
// })();

void (async () => {
	const prisma = new PrismaClient();
	await prisma.$connect();

	const footageRaw = await prisma.footage.findMany({ include: { downloads: true } });
	const footage = footageRaw.filter((f) => !f.preview?.length && f.type === "video");

	for await (const item of footage) {
		console.log(`Running for ${item.name} (${footage.indexOf(item) + 1}/${footage.length})`);
		const download = item.downloads.find((d) => d.name.includes("HD")) || item.downloads[0];

		try {
			console.log(`Downloading the video...`);
			const { data: video } = await axios.get<Buffer>(download.url, { responseType: "arraybuffer" });

			console.log(`Saving video...`);
			const savePathVideo = join(process.cwd(), "temp", item.downloads[0].url.split("/").reverse()[0]);
			const savePathScreenshot = join(process.cwd(), "temp", `${item.id}.png`);
			await writeFile(savePathVideo, video);

			console.log(`Creating thumbnail...`);
			const ffmpeg = Ffmpeg(savePathVideo);
			await new Promise((res) => ffmpeg.screenshot(1).on("end", res).on("error", res).output(savePathScreenshot).run());

			console.log(`Uploading thumbnail...`);
			const screenshot = await readFile(savePathScreenshot);
			const form = new FormData();
			form.append("upload", screenshot, `preview.png`);

			const req = await axios<{ url: string }>(`${process.env.UPLOAD_API}/api/upload`, {
				data: form,
				method: "POST",
				headers: { Authorization: process.env.UPLOAD_API_KEY, "Content-Type": "multipart/form-data" }
			});

			console.log(`Upload completed, editing config...`);
			await prisma.footage.update({ where: { id: item.id }, data: { preview: req.data.url.replace("http://", "https://") } });
			console.log(`Continuing with next item`);
		} catch (err) {
			console.error(err);
			console.log(`Failed to optimise ${item.name} (${footage.indexOf(item) + 1}/${footage.length})`);
		}
	}
})();
