export const mimeTypes = {
	// Text & Books
	epub: "application/epub+zip",
	pdf: "application/pdf",
	mobi: "application/x-mobipocket-ebook",
	cbr: "application/x-cbr", // Comic Book RAR
	cbz: "application/x-cbz", // Comic Book ZIP
	html: "text/html",
	djvu: "image/vnd.djvu",
	xps: "application/vnd.ms-xpsdocument",
	cbt: "application/x-cbt",
	fb2: "application/x-fb2",
	pdb: "application/vnd.palm",
	txt: "text/plain",
	rtf: "application/rtf",
	chm: "application/vnd.ms-htmlhelp",
	doc: "application/msword",
	zip: "application/zip",
	json: "application/json",

	// Images
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",

	// Fallback
	default: "application/octet-stream",
};

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "PUT, GET, PROPFIND, OPTIONS, DELETE, MKCOL",
	"Access-Control-Allow-Headers": "Authorization, Depth, Content-Type",
};

export async function is_authorized(authorization_header, username, password) {
	const encoder = new TextEncoder();

	const header = encoder.encode(authorization_header);

	const expected = encoder.encode(`Basic ${btoa(`${username}:${password}`)}`);

	if (header.byteLength !== expected.byteLength) {
		return false; // Length mismatch
	}

	return await crypto.subtle.timingSafeEqual(header, expected)

}