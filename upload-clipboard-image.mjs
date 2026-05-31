import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import clipboard from 'clipboardy';

const MIME_TYPE = 'image/png';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

config({ path: join(SCRIPT_DIR, '.env') });

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

function appleScriptString(value) {
  return JSON.stringify(String(value));
}

function notify(title, message) {
  try {
    execFileSync('osascript', [
      '-e',
      `display notification ${appleScriptString(message)} with title ${appleScriptString(title)}`,
    ]);
  } catch {
    // Notification failures should not hide the real upload error.
  }
}

function getClipboardPng(tempPath) {
  try {
    execFileSync('osascript', [
      '-e',
      `
      set fileRef to missing value
      try
        set pngData to the clipboard as «class PNGf»
        set fileRef to open for access POSIX file ${appleScriptString(tempPath)} with write permission
        write pngData to fileRef
        close access fileRef
      on error errorMessage number errorNumber
        if fileRef is not missing value then
          try
            close access fileRef
          end try
        end if
        error errorMessage number errorNumber
      end try
    `,
    ]);
  } catch {
    throw new Error('Clipboard does not contain a PNG image. Copy a screenshot or PNG image first.');
  }
}

function reportError(error) {
  const message = error instanceof Error ? error.message : String(error);

  notify('Upload failed', message);
  console.error(`Upload failed: ${message}`);
}

function cleanupTempFile(tempPath) {
  try {
    unlinkSync(tempPath);
  } catch {
    // Ignore cleanup errors
  }
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function uploadPng(webAppUrl, token, fileName, base64) {
  const url = new URL(webAppUrl);
  url.searchParams.set('token', token);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, mimeType: MIME_TYPE, base64 }),
  });

  const text = await response.text();
  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Upload returned ${response.status}: ${text.slice(0, 200)}`);
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Upload failed with HTTP ${response.status}`);
  }

  return result.url;
}

async function main() {
  const fileName = `${getTimestamp()}.png`;
  const tempPath = join(tmpdir(), fileName);

  try {
    const webAppUrl = requireEnv('WEB_APP_URL');
    const token = requireEnv('UPLOAD_TOKEN');

    getClipboardPng(tempPath);

    const url = await uploadPng(
      webAppUrl,
      token,
      fileName,
      readFileSync(tempPath).toString('base64'),
    );
    await clipboard.write(url);

    notify('Screenshot uploaded', 'Google Drive link copied to clipboard');
    console.log(url);
  } catch (error) {
    reportError(error);
    // Keep exit code 0 so macOS Shortcuts does not show its own error dialog.
  } finally {
    cleanupTempFile(tempPath);
  }
}

main();
