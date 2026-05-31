const MIME_TYPE = 'image/png';

function requireScriptProperty(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);

  if (!value) {
    throw new Error('Missing script property: ' + name);
  }

  return value;
}

function doPost(e) {
  try {
    const token = requireScriptProperty('UPLOAD_TOKEN');

    if (!e || !e.parameter || e.parameter.token !== token) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    const body = JSON.parse(e.postData.contents);
    const missingFields = ['fileName', 'mimeType', 'base64'].filter(function (field) {
      return !body[field];
    });

    if (missingFields.length) {
      return jsonResponse({ ok: false, error: 'Missing ' + missingFields.join(', ') });
    }

    if (body.mimeType !== MIME_TYPE || !String(body.fileName).endsWith('.png')) {
      return jsonResponse({ ok: false, error: 'Only PNG uploads are allowed' });
    }

    const bytes = Utilities.base64Decode(body.base64);
    const folder = DriveApp.getFolderById(requireScriptProperty('FOLDER_ID'));
    const file = folder.createFile(Utilities.newBlob(bytes, MIME_TYPE, body.fileName));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();

    return jsonResponse({
      ok: true,
      fileId,
      fileName: file.getName(),
      url: 'https://drive.google.com/file/d/' + fileId + '/view',
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error),
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
