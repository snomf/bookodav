
import html from '../src/public/dash/index.html'
import { corsHeaders, is_authorized } from './utils'
import { dumpCache, handleDeleteFile, handleFileList, handleGetFile, handleMultpleUploads, handlePutFile } from './handlers'

const AUTH_REALM = 'BOOKO-DAV';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;

		// Serve Favicon
		if (request.method === "GET" && path === "/favicon.ico") {
			return new Response("Not found", { status: 404 });
		}

		// Handle OPTIONS (CORS)
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Serve the SPA UI for root and legacy UI routes
		if (request.method === "GET") {
			const accept = request.headers.get("Accept") || "";
			const isBrowser = accept.includes("text/html");

			if (path === "/" || ((path === "/dav" || path === "/dav/" || path === "/dav/list" || path === "/dav/upload" || path === "/dav/wiki") && isBrowser)) {
				return new Response(html, {
					headers: {
						"Content-Type": "text/html",
						"Cache-Control": "public, max-age=604800"
					},
				});
			}
		}

		// Extract the Authorization header for WebDAV routes
		const authorization_header = request.headers.get("Authorization") || "";

		// Authentication check for all non-UI routes
		if (!(await is_authorized(authorization_header, env.USERNAME, env.PASSWORD))) {
			// Return 401 Unauthorized if credentials are invalid
			return new Response("Unauthorized", {
				status: 401,
				headers: {
					"WWW-Authenticate": `Basic realm="${AUTH_REALM}"`,
					...corsHeaders
				},
			});
		}

		// Cache operations
		if (request.method === "GET" && path === "/dumpcache") {
			return dumpCache(request, env, ctx);
		}

		// WebDAV Handlers
		if (request.method === "PUT") {
			return handlePutFile(request, env, ctx)
		}

		if (request.method === 'DELETE') {
			return handleDeleteFile(request, env, ctx);
		}

		if (request.method === "POST" && path === "/upload") {
			return handleMultpleUploads(request, env, ctx)
		}

		if (request.method === "GET") {
			return handleGetFile(request, env, ctx)
		}

		if (request.method === "PROPFIND") {
			return handleFileList(request, env, ctx)
		}

		if (request.method === "MKCOL") {
			// Basic implementation of MKCOL (creating folders in R2 is just prefixes)
			// R2 doesn't have real folders, so we just acknowledge it.
			return new Response("Created", { status: 201, headers: corsHeaders });
		}

		return new Response("Method not allowed", { status: 405, headers: corsHeaders });
	},
};