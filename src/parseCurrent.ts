import { PrismaClient } from "@prisma/client";
import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";
import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), "data", ".env") });

void (async () => {
	const prisma = new PrismaClient();
	await prisma.$connect();

	const footageRaw = await prisma.footage.findMany({ include: { downloads: true } });
	const footage = footageRaw.filter((f) => !f.preview?.length);

	for await (const item of footage) {
		console.log(`Running for ${item.name} (${footage.indexOf(item) + 1}/${footage.length})`);
		const download = item.downloads.find((d) => d.name.includes("HD")) || item.downloads[0];

		try {
			console.log(`Downloading the image...`);
			const { data: image } = await axios.get<Buffer>(download.url, { responseType: "arraybuffer" });
			const transformer = sharp(image, { sequentialRead: true });
			transformer.rotate();

			switch (download.url.split(".").reverse()[0]) {
				case "png":
					transformer.png({ quality: 12 });
					break;
				case "jpg":
				case "jpeg":
					transformer.jpeg({ quality: 12 });
					break;
				case "webp":
					transformer.webp({ quality: 12 });
					break;
				default:
					console.log(`Item is not an image, skipping...`);
					continue;
			}

			transformer.resize(320, 180);
			console.log(`Downloaded the image, optimising...`);
			const optBuffer = await transformer.toBuffer();
			console.log(`Optimising complete, uploading...`);

			const form = new FormData();
			form.append("upload", optBuffer, `optimised.${download.url.split(".").reverse()[0]}`);

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
