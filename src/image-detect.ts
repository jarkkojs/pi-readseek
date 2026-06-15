const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWithBytes(buffer: Buffer, bytes: number[]): boolean {
	return buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);
}

function startsWithAscii(buffer: Buffer, offset: number, text: string): boolean {
	if (buffer.length < offset + text.length) return false;
	for (let index = 0; index < text.length; index++) {
		if (buffer[offset + index] !== text.charCodeAt(index)) return false;
	}
	return true;
}

function readUint32BE(buffer: Buffer, offset: number): number {
	return (
		((buffer[offset] ?? 0) * 0x1000000) +
		((buffer[offset + 1] ?? 0) << 16) +
		((buffer[offset + 2] ?? 0) << 8) +
		(buffer[offset + 3] ?? 0)
	);
}

function isPng(buffer: Buffer): boolean {
	return buffer.length >= 16 && readUint32BE(buffer, PNG_SIGNATURE.length) === 13 && startsWithAscii(buffer, 12, "IHDR");
}

function isAnimatedPng(buffer: Buffer): boolean {
	let offset = PNG_SIGNATURE.length;
	while (offset + 8 <= buffer.length) {
		const chunkLength = readUint32BE(buffer, offset);
		const chunkTypeOffset = offset + 4;
		if (startsWithAscii(buffer, chunkTypeOffset, "acTL")) return true;
		if (startsWithAscii(buffer, chunkTypeOffset, "IDAT")) return false;
		const nextOffset = offset + 8 + chunkLength + 4;
		if (nextOffset <= offset || nextOffset > buffer.length) return false;
		offset = nextOffset;
	}
	return false;
}

export function isSupportedImageBuffer(buffer: Buffer): boolean {
	if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return buffer[3] !== 0xf7;
	if (startsWithBytes(buffer, PNG_SIGNATURE)) return isPng(buffer) && !isAnimatedPng(buffer);
	if (startsWithAscii(buffer, 0, "GIF")) return true;
	return startsWithAscii(buffer, 0, "RIFF") && startsWithAscii(buffer, 8, "WEBP");
}
