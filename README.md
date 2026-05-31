# Google Drive Clipboard Uploader

Simple macOS utility that uploads a PNG image from the clipboard to Google Drive and copies the generated Google Drive link back to the clipboard.

## How It Works

```text
Copy image to clipboard -> Run shortcut -> Upload to Google Drive -> Copy Drive link to clipboard
```

## Requirements

- macOS
- Node.js 20+
- Google account
- Google Drive folder

## Installation

### 1. Clone Repository

```bash
git clone git@github.com:asevrin/google-drive-clipboard-uploader.git
cd google-drive-clipboard-uploader
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Google Drive Folder

Create any folder where uploaded images should be stored.

Open the folder and copy its ID from the URL.

Example:

```text
https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
```

Folder ID:

```text
1AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 4. Generate Upload Token

```bash
openssl rand -hex 32
```

Save the generated value.

### 5. Create Google Apps Script

Open:

```text
https://script.google.com/home
```

Create a new project. In the default `Code.gs` file, replace the default code with the contents of local file `google-script.gs`.

### 6. Configure Script Properties

Open:

```text
Project Settings -> Script Properties
```

Create the following properties:

```text
FOLDER_ID=<google_drive_folder_id>
UPLOAD_TOKEN=<generated_token>
```

### 7. Deploy Apps Script

Open:

```text
Deploy -> New deployment -> Web app
```

Configuration:

```text
Execute as: Me
Who has access: Anyone
```

In some Google interfaces, `Anyone` may be displayed as `Everyone` or `Усі`.

After deployment, copy the generated Web App URL.

Example:

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 8. Configure Local Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Fill in the values:

```env
WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
UPLOAD_TOKEN=<same_token_as_apps_script>
```

## Usage

Copy any PNG image to clipboard and run:

```bash
npm run upload
```

After a successful upload:

- Image is stored in Google Drive.
- Google Drive link is copied to clipboard.
- A macOS notification is displayed.

## macOS Shortcut

Open the Shortcuts app and create a new shortcut.

Add action:

```text
Run Shell Script
```

Use:

```bash
/opt/homebrew/bin/node /absolute/path/to/google-drive-clipboard-uploader/upload-clipboard-image.mjs
```

To find your Node.js path:

```bash
which node
```

The script loads `.env` from its own project directory, so the shortcut does not need to `cd` into the project first.

## Troubleshooting

### Shortcut Does Nothing

Check:

```text
System Settings -> Keyboard -> Keyboard Shortcuts -> Services
```

Make sure the shortcut is enabled.

### command not found: node

Use the full Node.js path:

```bash
which node
```

Example:

```bash
/opt/homebrew/bin/node
```

### Unauthorized

The `UPLOAD_TOKEN` value in `.env` does not match `UPLOAD_TOKEN` in Apps Script Script Properties.

### Upload Returned Non-JSON Response

Usually caused by one of the following:

- Wrong `WEB_APP_URL`
- URL does not end with `/exec`
- Apps Script was not deployed as a Web App
- Access is not set to `Anyone`

### No Image Uploaded

Make sure a PNG image is copied to the clipboard before running the script.

## License

MIT
