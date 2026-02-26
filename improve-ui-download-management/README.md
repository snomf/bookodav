# Booko-DAV — Personal Book Cloud (Frontend UI)

## For Jules / AI Implementation Guide

This README is written specifically for **Jules (Google's AI coding assistant)** to understand the full architecture, what has been implemented, and what still needs to be done. Read this ENTIRE document before making changes.

---

## 🏗 Architecture Overview

This is a **React + Vite + Tailwind CSS** single-page application that serves as a WebDAV client for managing ebooks, documents, and images. It is compiled into a **single HTML file** (via `vite-plugin-singlefile`) that gets served by a Cloudflare Worker alongside the WebDAV API.

### Key Constraint
The built `dist/index.html` is a self-contained SPA. The WebDAV server URL is the **same origin** as the site itself (e.g., `bookodav-worker.user.workers.dev`). The WebDAV endpoint is at `/dav` on that same domain.

---

## 📁 File Structure

```
src/
├── App.tsx                    # Main app component, state management
├── main.tsx                   # Entry point
├── index.css                  # Global styles, animations, Tailwind
├── types.ts                   # All TypeScript types, format maps, utilities
├── utils/
│   └── cn.ts                  # Tailwind class merge utility
├── hooks/
│   └── useWebDAV.ts           # WebDAV operations hook (PROPFIND, GET, PUT, DELETE, MKCOL)
└── components/
    ├── Sidebar.tsx             # Navigation sidebar with category shortcuts
    ├── ConnectForm.tsx         # WebDAV connection form (URL, user, pass)
    ├── Library.tsx             # Main file browser with grid/list views
    ├── FileViewer.tsx          # In-browser file viewer/reader
    ├── CategoryView.tsx        # Category management page
    └── SetupGuide.tsx          # Setup instructions
```

---

## 📚 Supported File Formats

The app supports ALL of these book/document formats:

| Format | Extension | Viewable In-Browser | Notes |
|--------|-----------|-------------------|-------|
| PDF | `.pdf` | ✅ Yes (iframe) | Full embedded viewer |
| EPUB | `.epub` | ❌ Not yet | **TODO: Add epub.js reader** |
| MOBI | `.mobi` | ❌ Info card only | Amazon format, hard to render |
| AZW/AZW3 | `.azw`, `.azw3` | ❌ Info card only | Kindle format |
| FB2 | `.fb2` | ❌ Not yet | **TODO: Parse XML and render** |
| DJVU | `.djvu` | ❌ Info card only | Needs specialized decoder |
| CBR | `.cbr` | ❌ Not yet | **TODO: Extract and show images** |
| CBZ | `.cbz` | ❌ Not yet | **TODO: Extract ZIP and show images** |
| TXT | `.txt` | ✅ Yes | Code-style viewer |
| HTML/HTM | `.html`, `.htm` | ✅ Yes (iframe) | Sandboxed iframe |
| DOC/DOCX | `.doc`, `.docx` | ❌ Info card only | Needs conversion |
| RTF | `.rtf` | ❌ Info card only | Needs conversion |
| LIT | `.lit` | ❌ Info card only | Legacy MS format |
| ZIP/RAR | `.zip`, `.rar` | ❌ Info card only | Archives |
| Images | `.jpg`, `.png`, etc. | ✅ Yes | With zoom controls |
| Markdown | `.md` | ✅ Yes | Plain text display |
| JSON/XML/CSS | Various | ✅ Yes | Code-style viewer |

---

## 🎨 UI Design System

### Theme
- **Dark theme** with slate-950 background
- **Amber/orange** accent colors (from-amber-500 to-orange-500)
- **Glassmorphism** with backdrop-blur on overlays
- **Inter** font family (loaded from Google Fonts)

### Animations (defined in index.css)
- `animate-fade-in` — opacity 0→1
- `animate-slide-up` — fade + translateY
- `animate-scale-in` — fade + scale
- `animate-float` — gentle float for empty states
- `.book-card` class — hover lift + shadow

### Color System for Formats
Every file format has a unique color defined in `types.ts > FORMAT_MAP`. This color is used for:
- Format badge background
- Book card gradient accent
- Icon coloring
- Category view file type indicators

---

## 🔧 How WebDAV Works (`useWebDAV.ts`)

### Connection
1. User enters WebDAV URL, username, password
2. Credentials stored in `localStorage` as `bookodav-config`
3. On connect, sends `PROPFIND` to list root directory
4. Auth uses HTTP Basic (`Authorization: Basic base64(user:pass)`)

### Operations
- **`PROPFIND`** with `Depth: 1` — Lists directory contents
- **`GET`** — Downloads file as blob for viewing
- **`PUT`** — Uploads file
- **`DELETE`** — Removes file or directory
- **`MKCOL`** — Creates directory

### XML Parsing
WebDAV responses are XML (MultiStatus). The parser handles multiple namespace formats:
- `DAV:` namespace
- `D:` prefix
- Plain element names (no namespace)

---

## 📂 Category System

### How It Works Currently
- Categories are stored in **localStorage** (`bookodav-categories`)
- Each category has: `id`, `name`, `color`, `files[]` (array of file hrefs)
- Default categories: Fiction, Non-Fiction, Technical, Academic, Comics & Manga, Magazines
- Users can create custom categories with custom colors

### How It SHOULD Work (TODO for Jules)
Categories should **also** be persisted to the WebDAV server as a JSON file:

1. **Save**: When categories change, `PUT` a file called `/.bookodav-meta.json` to the WebDAV root
2. **Load**: On connect, try to `GET /.bookodav-meta.json` from the server
3. **Merge**: If server has data, merge with localStorage (server wins on conflict)
4. **Format** of `.bookodav-meta.json`:
```json
{
  "version": 1,
  "categories": [
    {
      "id": "fiction",
      "name": "Fiction",
      "color": "#8b5cf6",
      "files": ["/books/novel.epub", "/books/story.pdf"]
    }
  ],
  "fileMetadata": {
    "/books/novel.epub": {
      "title": "My Novel",
      "author": "John Doe"
    }
  }
}
```

### Implementation Steps for Jules:
1. In `useWebDAV.ts`, add a `saveMetadata(meta: BookodavMeta)` method:
   - `PUT` to `{baseUrl}/.bookodav-meta.json` with `Content-Type: application/json`
   - Body is `JSON.stringify(meta)`
2. Add a `loadMetadata(): Promise<BookodavMeta | null>` method:
   - `GET` from `{baseUrl}/.bookodav-meta.json`
   - Parse JSON response
   - Return null if 404
3. In `App.tsx`, after successful `connect()`:
   - Call `loadMetadata()`
   - If data exists, use it to set categories state
   - If not, use localStorage fallback
4. When categories change (via `useEffect`):
   - Save to localStorage (immediate, for offline)
   - Debounce save to WebDAV (e.g., 2 second delay after last change)

---

## 📖 File Viewer / Reader (`FileViewer.tsx`)

### Current Behavior
- Opens as a **full-screen overlay** (fixed, z-50)
- **NEVER auto-downloads** — always shows a viewer or info card
- For viewable files (PDF, images, text): renders in-browser
- For non-viewable files: shows a beautiful info card with file metadata and a manual download button

### The Viewer Flow
1. User clicks file in Library → `selectedFile` state set → `FileViewer` renders
2. FileViewer checks if file is viewable (`isViewableInBrowser()`)
3. If viewable: fetches blob via `GET`, creates object URL, renders
4. If not viewable: shows info card (no fetch, no download)

### How Each Format Renders
- **PDF**: `<iframe src={blobUrl}>` — native browser PDF viewer
- **Images**: `<img>` with zoom controls (+/-/reset)
- **Text/MD/JSON/XML/CSS/CSV**: `<pre>` with monospace font, line wrapping
- **HTML/HTM**: `<iframe srcDoc={html}>` sandboxed
- **Books (epub, mobi, etc.)**: Info card with format badge, file size, metadata parsed from filename

### TODO for Jules — EPUB Reader
To add EPUB reading support:
1. Install `epub.js`: `npm install epubjs`
2. In FileViewer, when ext is `.epub`:
   - Fetch the file as an ArrayBuffer
   - Create an ePub instance: `const book = ePub(arrayBuffer)`
   - Create a rendition: `book.renderTo(containerElement, { width: '100%', height: '100%' })`
   - Add prev/next page navigation buttons
3. This will allow reading EPUBs directly in the browser!

### TODO for Jules — FB2 Reader
FB2 files are XML-based. To render them:
1. Fetch the file as text
2. Parse the XML
3. Extract `<body>` content and convert to HTML
4. Render in an iframe or a styled div
5. Extract metadata from `<description>` element (title, author)

### TODO for Jules — CBZ Reader (Comic Books)
CBZ files are ZIP archives of images:
1. Install `jszip`: `npm install jszip`
2. Fetch the CBZ as ArrayBuffer
3. Use JSZip to extract images
4. Display images in a vertical scroll or page-by-page view with navigation

---

## 📋 Book Metadata (`types.ts > parseFilenameMetadata`)

### Current Implementation
Extracts metadata from the filename using patterns:
- `"Author - Title.epub"` → `{ author: "Author", title: "Title" }`
- `"Title (2023).pdf"` → `{ title: "Title" }`
- `"filename.pdf"` → `{ title: "filename" }`

### TODO for Jules — EPUB Metadata Extraction
EPUBs contain rich metadata in their OPF file:
1. When loading an EPUB in the viewer, extract metadata:
   - Title: `<dc:title>`
   - Author: `<dc:creator>`
   - Description: `<dc:description>`
   - Cover: Usually referenced in `<meta name="cover" content="cover-image-id">`
2. Store extracted metadata in the `fileMetadata` section of `.bookodav-meta.json`
3. Display cover images as thumbnails in the Library grid view

---

## 🖼 Library View (`Library.tsx`)

### Features
- **Grid view**: Book-style cards with format badges, gradient accents, hover effects
- **List view**: Compact rows with file info
- **Search**: Real-time filename search
- **Filter tabs**: All, Books, Comics, Images, Documents, Archives, Other
- **Sort**: By name, size, date, or type (toggle asc/desc)
- **Breadcrumb navigation**: Navigate directories
- **Drag & drop upload**: Drop files anywhere to upload
- **Context menu**: Right-click for View, Categorize, Delete
- **Stats bar**: Shows file counts by type

### Book Cards (Grid View)
Each book file renders as a tall card resembling a book:
- Colored left border (spine) matching format color
- Format badge (e.g., "EPUB" in purple)
- Book icon
- Title parsed from filename
- Author if detectable from filename pattern
- File size
- Category dots

### TODO for Jules — Cover Thumbnails
Once EPUB metadata extraction is working:
1. Show the extracted cover image as the card background
2. Fallback to the format-colored placeholder if no cover
3. Cache covers in memory or via object URLs

---

## ⚡ Key Behaviors

### "Never Download, Always View"
The most important UX rule: clicking a file should NEVER trigger a browser download.
- Files open in the FileViewer overlay
- The FileViewer fetches the file via `GET` and creates an object URL
- Object URLs are displayed in iframes/img tags, NOT via download links
- Only the explicit "Download" button in the FileViewer should trigger a download
- The download button uses `<a download={filename}>` to force download

### Category Assignment
Users can assign files to categories in 3 ways:
1. Right-click file in Library → Categorize → Pick category
2. Click Tag icon in FileViewer header → Pick category
3. In CategoryView, click + on a category → Select files

### Responsive Design
- Sidebar collapses on mobile (hamburger menu)
- Grid columns adjust: 2 cols on mobile → 7 cols on 2xl
- Filter tabs hide labels on small screens (icons only)
- FileViewer zoom controls hide on mobile

---

## 🚀 Deployment

This app is built as a single HTML file and served by the Cloudflare Worker. The build process:
1. `npm run build` runs Vite
2. `vite-plugin-singlefile` inlines all JS/CSS into `dist/index.html`
3. The Worker serves this HTML file for non-WebDAV routes
4. WebDAV routes (`/dav/*`) are handled by the Worker's WebDAV logic

---

## 📝 Summary of TODO Items for Jules

### Priority 1 (Most Important)
- [ ] **WebDAV category sync**: Save/load `.bookodav-meta.json` to persist categories across devices
- [ ] **EPUB reader**: Install `epubjs` and render EPUBs in-browser with page navigation
- [ ] **EPUB metadata**: Extract title, author, cover from EPUB files

### Priority 2
- [ ] **FB2 reader**: Parse FB2 XML and render as HTML
- [ ] **CBZ comic reader**: Extract images from CBZ (ZIP) and display with page navigation
- [ ] **Cover thumbnails**: Show extracted book covers in Library grid cards

### Priority 3 (Nice to Have)
- [ ] **Batch upload progress**: Show progress bar for multiple file uploads
- [ ] **Reading progress**: Track last page read for each book
- [ ] **Search within categories**: Filter files within a specific category
- [ ] **Dark/light reader modes**: Toggle reader background color
- [ ] **Font size controls**: In text/EPUB reader, adjust font size

---

## 🎯 Important Notes for Jules

1. **DO NOT modify `package.json` or `vite.config.ts` directly** — use the proper tools
2. **All files must compile with TypeScript strict mode** — no `any` types unless necessary
3. **The app uses Tailwind CSS v4** with `@import "tailwindcss"` syntax
4. **Lucide React** is the icon library — import icons from `lucide-react`
5. **The `cn()` utility** in `src/utils/cn.ts` merges Tailwind classes (clsx + tailwind-merge)
6. **Animations** are defined in `src/index.css` — use the `.animate-*` classes
7. **The app must work as a single file** — no external assets, no separate CSS files
8. **WebDAV operations** all go through the `useWebDAV` hook — don't make raw fetch calls in components
9. **Categories save to localStorage immediately** and should debounce-save to WebDAV
10. **The FileViewer MUST NOT auto-download files** — it should always show a viewer or info card first
