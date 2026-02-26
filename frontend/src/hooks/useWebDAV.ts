import { useState, useCallback } from 'react';
import { WebDAVFile, ConnectionConfig, BookodavMeta } from '../types';

export function useWebDAV() {
  const [files, setFiles] = useState<WebDAVFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig | null>(() => {
    try {
      const saved = localStorage.getItem('bookodav-config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentPath, setCurrentPath] = useState('/');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const getAuthHeader = useCallback((cfg: ConnectionConfig) => {
    return 'Basic ' + btoa(cfg.username + ':' + cfg.password);
  }, []);

  const parseWebDAVResponse = useCallback((xml: string, basePath: string, currentRequestPath: string): WebDAVFile[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    let responses: Element[] = [];
    const nsResponses = doc.getElementsByTagNameNS('DAV:', 'response');
    if (nsResponses.length > 0) {
      responses = Array.from(nsResponses);
    } else {
      const plainResponses = doc.querySelectorAll('response');
      if (plainResponses.length > 0) {
        responses = Array.from(plainResponses);
      } else {
        const prefixResponses = doc.querySelectorAll('D\\:response');
        responses = Array.from(prefixResponses);
      }
    }

    const files: WebDAVFile[] = [];
    const normalizedBase = basePath.replace(/\/$/, '');

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];

      let href = '';
      const hrefEl = response.getElementsByTagNameNS('DAV:', 'href')[0]
        || response.querySelector('href')
        || response.querySelector('D\\:href');
      if (hrefEl) {
        href = hrefEl.textContent || '';
      }
      if (!href) continue;

      try {
        href = decodeURIComponent(href);
      } catch { /* keep as-is */ }

      let relativePath = href;
      if (href.startsWith('http')) {
        try {
          relativePath = new URL(href).pathname;
        } catch { /* keep as-is */ }
      }

      if (relativePath.startsWith(normalizedBase)) {
        relativePath = relativePath.substring(normalizedBase.length);
      }
      if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
      }

      const normalizedRelative = relativePath.replace(/\/$/, '') || '/';
      const normalizedCurrent = currentRequestPath.replace(/\/$/, '') || '/';
      if (normalizedRelative === normalizedCurrent) continue;

      const resourceType = response.getElementsByTagNameNS('DAV:', 'resourcetype')[0]
        || response.querySelector('resourcetype')
        || response.querySelector('D\\:resourcetype');
      const collection = resourceType?.getElementsByTagNameNS('DAV:', 'collection')[0]
        || resourceType?.querySelector('collection')
        || resourceType?.querySelector('D\\:collection');
      const isDirectory = !!collection;

      let size = 0;
      const sizeEl = response.getElementsByTagNameNS('DAV:', 'getcontentlength')[0]
        || response.querySelector('getcontentlength')
        || response.querySelector('D\\:getcontentlength');
      if (sizeEl?.textContent) {
        size = parseInt(sizeEl.textContent, 10) || 0;
      }

      let lastModified = '';
      const modEl = response.getElementsByTagNameNS('DAV:', 'getlastmodified')[0]
        || response.querySelector('getlastmodified')
        || response.querySelector('D\\:getlastmodified');
      if (modEl) {
        lastModified = modEl.textContent || '';
      }

      let contentType = '';
      const typeEl = response.getElementsByTagNameNS('DAV:', 'getcontenttype')[0]
        || response.querySelector('getcontenttype')
        || response.querySelector('D\\:getcontenttype');
      if (typeEl) {
        contentType = typeEl.textContent || '';
      }

      const parts = relativePath.replace(/\/$/, '').split('/').filter(Boolean);
      const name = parts[parts.length - 1] || '';

      if (name && name !== '.' && name !== '..') {
        files.push({ href: relativePath, name, isDirectory, size, lastModified, contentType });
      }
    }

    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return files;
  }, []);

  const fetchFiles = useCallback(async (cfg: ConnectionConfig, path: string) => {
    const baseUrl = cfg.url.replace(/\/$/, '');
    const url = baseUrl + (path.startsWith('/') ? path : '/' + path);

    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': getAuthHeader(cfg),
        'Depth': '1',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: '<?xml version="1.0" encoding="UTF-8"?><D:propfind xmlns:D="DAV:"><D:allprop/></D:propfind>',
    });

    if (!response.ok && response.status !== 207) {
      if (response.status === 401) throw new Error('Authentication failed. Check your username and password.');
      if (response.status === 404) throw new Error('WebDAV endpoint not found. Check your URL.');
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const basePath = new URL(baseUrl).pathname;
    return parseWebDAVResponse(xml, basePath, path);
  }, [getAuthHeader, parseWebDAVResponse]);

  const connect = useCallback(async (cfg: ConnectionConfig) => {
    setLoading(true);
    setError(null);
    try {
      const parsedFiles = await fetchFiles(cfg, '/');
      setFiles(parsedFiles);
      setConfig(cfg);
      setConnected(true);
      setCurrentPath('/');
      localStorage.setItem('bookodav-config', JSON.stringify(cfg));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to WebDAV server';
      setError(message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const listFiles = useCallback(async (path: string = '/') => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const parsedFiles = await fetchFiles(config, path);
      setFiles(parsedFiles);
      setCurrentPath(path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to list files';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [config, fetchFiles]);

  const uploadFile = useCallback(async (file: File, path: string = '/') => {
    if (!config) return;
    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    setError(null);
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const filePath = path.endsWith('/') ? path : path + '/';
      const url = baseUrl + filePath + encodeURIComponent(file.name);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(config),
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
      }

      await listFiles(currentPath);
      setUploadProgress(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }, [config, getAuthHeader, listFiles, currentPath]);

  const deleteFile = useCallback(async (filePath: string) => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const url = baseUrl + filePath;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader(config) },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      await listFiles(currentPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [config, getAuthHeader, listFiles, currentPath]);

  const deleteMultipleFiles = useCallback(async (filePaths: string[]) => {
    if (!config || filePaths.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const auth = getAuthHeader(config);

      const results = await Promise.all(filePaths.map(async path => {
        const url = baseUrl + path;
        try {
          const response = await fetch(url, { method: 'DELETE', headers: { 'Authorization': auth } });
          return response.ok;
        } catch {
          return false;
        }
      }));

      const failedCount = results.filter(r => !r).length;
      if (failedCount > 0) {
        throw new Error(`Failed to delete ${failedCount} file(s)`);
      }

      await listFiles(currentPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [config, getAuthHeader, listFiles, currentPath]);

  const getFileBlob = useCallback(async (filePath: string): Promise<Blob | null> => {
    if (!config) return null;
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const url = baseUrl + filePath;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': getAuthHeader(config) },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      return await response.blob();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      setError(message);
      return null;
    }
  }, [config, getAuthHeader]);

  const createDirectory = useCallback(async (path: string, name: string) => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const dirPath = path.endsWith('/') ? path : path + '/';
      const url = baseUrl + dirPath + encodeURIComponent(name) + '/';

      const response = await fetch(url, {
        method: 'MKCOL',
        headers: { 'Authorization': getAuthHeader(config) },
      });

      if (!response.ok) {
        throw new Error('Failed to create directory');
      }

      await listFiles(currentPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create directory failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [config, getAuthHeader, listFiles, currentPath]);

  /** Save metadata JSON to WebDAV server root */
  const saveMetadata = useCallback(async (meta: BookodavMeta) => {
    if (!config) return;
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const url = baseUrl + '/.bookodav-meta.json';
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meta, null, 2),
      });
    } catch {
      // Silently fail — localStorage is the primary store
    }
  }, [config, getAuthHeader]);

  /** Load metadata JSON from WebDAV server root */
  const loadMetadata = useCallback(async (): Promise<BookodavMeta | null> => {
    if (!config) return null;
    try {
      const baseUrl = config.url.replace(/\/$/, '');
      const url = baseUrl + '/.bookodav-meta.json';
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': getAuthHeader(config) },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data as BookodavMeta;
    } catch {
      return null;
    }
  }, [config, getAuthHeader]);

  const disconnect = useCallback(() => {
    setConnected(false);
    setConfig(null);
    setFiles([]);
    setCurrentPath('/');
    setError(null);
    localStorage.removeItem('bookodav-config');
  }, []);

  return {
    files,
    loading,
    error,
    connected,
    config,
    currentPath,
    uploading,
    uploadProgress,
    connect,
    listFiles,
    uploadFile,
    deleteFile,
    deleteMultipleFiles,
    getFileBlob,
    createDirectory,
    saveMetadata,
    loadMetadata,
    disconnect,
    setError,
  };
}
