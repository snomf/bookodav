import { corsHeaders, mimeTypes } from './utils'

function getDavPath(pathname) {
    let path = decodeURIComponent(pathname);
    if (path === "/dav" || path.startsWith("/dav/")) {
        path = path.slice(4);
    }
    return path.replace(/^\/+/, "");
}

export async function handleDeleteFile(request, env, ctx) {
    const url = new URL(request.url);
    const filePath = getDavPath(url.pathname);

    if (filePath.includes("..")) {
        return new Response("Invalid path", { status: 400 });
    }
    try {
        await env.MY_BUCKET.delete(filePath);

        let dir = "/";
        if (filePath.includes("/")) {
            const idx = filePath.lastIndexOf("/");
            dir = idx > 0 ? "/" + filePath.substring(0, idx) : "/";
        }

        const listingUrl = new URL(dir, url.origin).toString();
        const cache = caches.default;
        const cacheKey = new Request(listingUrl, { cf: { cacheTtl: 604800 } });
        ctx.waitUntil(cache.delete(cacheKey));

        return new Response('File deleted successfully', { status: 200 });
    } catch (error) {
        return new Response('Failed to delete file', { status: 500 });
    }
}

export async function handleMultpleUploads(request, env, ctx) {
    const formData = await request.formData();
    const results = [];
    for (const entry of formData.entries()) {
        const [fieldName, file] = entry;
        if (file instanceof File) {
            const filename = file.name;
            const extension = filename.split(".").pop().toLowerCase();
            const contentType = mimeTypes[extension] || mimeTypes.default;
            const data = await file.arrayBuffer();
            const sanitizedFilename = filename.replace(/^\/+/, ""); //remove leading slashes
            if (filename.includes("..")) { // Block path traversal
                return new Response("Invalid path", { status: 400 });
            }
            if (!sanitizedFilename) return new Response("Invalid filename", { status: 400 });
            try {
                await env.MY_BUCKET.put(sanitizedFilename, data, { httpMetadata: { contentType } });
                results.push({ sanitizedFilename, status: "success", contentType });
                //console.log(request.url)

                const cache = caches.default;
                const cacheKey = new Request(new URL("/", request.url).toString(), { cf: { cacheTtl: 604800 } });
                ctx.waitUntil(cache.delete(cacheKey));

            } catch (error) {
                //console.log("wtf");
                results.push({ filename, status: "failed", error: error.message });
            }
        }
    }

    return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export async function handleGetFile(request, env) {
    const url = new URL(request.url);
    const filename = getDavPath(url.pathname);

    const file = await env.MY_BUCKET.get(filename);

    if (file === null) {
        return new Response("File not found", { status: 404, headers: corsHeaders });
    }

    const extension = filename.split(".").pop().toLowerCase();
    const contentType = mimeTypes[extension] || mimeTypes.default;

    return new Response(file.body, {
        headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${filename}"`,
        },
    });
}

export async function handlePutFile(request, env, ctx) {
    const url = new URL(request.url);
    const filePath = getDavPath(url.pathname);

    if (filePath.includes("..") || filePath.trim() === "") {
        // If it's a directory (trailing slash), just return success
        if (url.pathname.endsWith('/')) {
            return new Response("Directory created", { status: 201, headers: corsHeaders });
        }
        return new Response("Invalid path", { status: 400 });
    }

    try {
        // Read the file data from the request body
        const data = await request.arrayBuffer();
        const extension = filePath.split(".").pop().toLowerCase();
        const contentType = mimeTypes[extension] || "application/octet-stream"; // Fallback MIME type

        // Upload the file to R2 with the given filePath as the key
        await env.MY_BUCKET.put(filePath, data, { httpMetadata: { contentType } });

        // Invalidate cache (ensure cache deletion works)
        const cache = caches.default;
        const listingUrl = new URL("/", request.url).toString();
        const cacheKey = new Request(listingUrl);
        ctx.waitUntil(cache.delete(cacheKey));

        return new Response("File uploaded successfully", { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return new Response("Failed to upload file", { status: 500 });
    }
}

export async function handleFileList(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    let davPath = getDavPath(path);

    // If listing a directory, ensure prefix ends with /
    let prefix = davPath;
    if (prefix && !prefix.endsWith('/')) {
        prefix += '/';
    }

    // List objects in R2 with the correct prefix and delimiter for directory behavior
    const objects = await env.MY_BUCKET.list({ prefix, delimiter: '/' });
    
    // Normalize path for hrefs
    const normalizedPath = path.endsWith('/') ? path : path + '/';

    // Generate WebDAV XML response
    let xmlResponse = `<?xml version="1.0" encoding="utf-8" ?>
      <D:multistatus xmlns:D="DAV:">
        <D:response>
          <D:href>${path}</D:href>
          <D:propstat>
            <D:prop>
              <D:resourcetype><D:collection/></D:resourcetype>
              <D:displayname>${davPath === "" ? "root" : davPath.split("/").filter(Boolean).pop()}</D:displayname>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
          </D:propstat>
        </D:response>`;

    // Add folders (delimited prefixes)
    if (objects.delimitedPrefixes) {
        for (const folder of objects.delimitedPrefixes) {
            const folderName = folder.slice(prefix.length, -1);
            xmlResponse += `
              <D:response>
                <D:href>${normalizedPath}${encodeURIComponent(folderName)}/</D:href>
                <D:propstat>
                  <D:prop>
                    <D:resourcetype><D:collection/></D:resourcetype>
                    <D:displayname>${folderName}</D:displayname>
                  </D:prop>
                  <D:status>HTTP/1.1 200 OK</D:status>
                </D:propstat>
              </D:response>`;
        }
    }

    // Add files
    for (const obj of objects.objects) {
        // Skip the directory itself if it's returned as an object
        if (obj.key === prefix) continue;

        const fileName = obj.key.slice(prefix.length);
        if (!fileName) continue;

        xmlResponse += `
          <D:response>
            <D:href>${normalizedPath}${encodeURIComponent(fileName)}</D:href>
            <D:propstat>
              <D:prop>
                <D:resourcetype/>
                <D:getcontentlength>${obj.size}</D:getcontentlength>
                <D:getlastmodified>${new Date(obj.uploaded).toUTCString()}</D:getlastmodified>
              </D:prop>
              <D:status>HTTP/1.1 200 OK</D:status>
            </D:propstat>
          </D:response>`;
    }

    xmlResponse += `</D:multistatus>`;

    return new Response(xmlResponse, {
        headers: {
            ...corsHeaders,
            "Content-Type": "application/xml; charset=utf-8",
        },
    });
}

export async function dumpCache(request, env, ctx){
    const url = new URL(request.url);
    try {
        const listingUrl = new URL('/', url.origin).toString();
        const cache = caches.default;
        const cacheKey = new Request(listingUrl, { cf: { cacheTtl: 604800 } });
        ctx.waitUntil(cache.delete(cacheKey));
        return new Response('cache deleted successfully', { status: 200 });
    } catch (error) {
        console.log("error",error);
        
        return new Response('Failed to delete cache', { status: 500 });
    }
}
