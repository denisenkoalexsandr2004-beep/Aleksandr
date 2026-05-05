const TELEGRAM_BOT_TOKEN = "8656474367:AAH3r5XhCZAqnNWAsyE_EN0k4xl7n6Vg5lo";
const TELEGRAM_CHAT_ID = "804998047";
const SHEET_ID = "1nyIgjIKR7IF7Hsx1BXMLeMGStndzrZ55HtP9-cWhDQQ";

const SHEET_HEADERS = [
  "Дата",
  "Имя",
  "Цель",
  "Опыт",
  "Где тренироваться",
  "Контакт",
  "Детали",
  "Источник",
  "Статус",
  "Приоритет",
  "Заметки",
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "Deus Forma webhook is alive" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    ensureSheetSetup_(sheet);

    const timestamp = new Date();
    const row = [
      timestamp,
      payload.name || "",
      payload.goal || "",
      payload.experience || "",
      payload.format || "",
      payload.contact || "",
      payload.details || "",
      payload.source || "Deus Forma website",
      "Новая",
      classifyPriority_(payload),
      "",
    ];

    sheet.appendRow(row);
    const rowIndex = sheet.getLastRow();
    styleNewRow_(sheet, rowIndex);

    const message = buildTelegramMessage_(payload, timestamp, rowIndex);

    UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
      muteHttpExceptions: true,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      // fall back to regular form fields
    }
  }

  return (e && e.parameter) ? e.parameter : {};
}

function ensureSheetSetup_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
  }

  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  const existingHeaders = headerRange.getValues()[0];

  if (existingHeaders.join("|") !== SHEET_HEADERS.join("|")) {
    headerRange.setValues([SHEET_HEADERS]);
  }

  headerRange
    .setFontWeight("bold")
    .setBackground("#111114")
    .setFontColor("#f1f0ec")
    .setHorizontalAlignment("center");

  sheet.setFrozenRows(1);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), SHEET_HEADERS.length).createFilter();
  }

  sheet.setColumnWidths(1, SHEET_HEADERS.length, 180);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 170);
  sheet.setColumnWidth(3, 280);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 210);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(7, 360);
  sheet.setColumnWidth(8, 170);
  sheet.setColumnWidth(9, 140);
  sheet.setColumnWidth(10, 140);
  sheet.setColumnWidth(11, 260);
}

function styleNewRow_(sheet, rowIndex) {
  const fullRowRange = sheet.getRange(rowIndex, 1, 1, SHEET_HEADERS.length);

  fullRowRange
    .setVerticalAlignment("top")
    .setWrap(true)
    .setBackground("#fbfaf7");

  sheet.getRange(rowIndex, 1).setNumberFormat("dd.MM.yyyy HH:mm");
  sheet.getRange(rowIndex, 9).setBackground("#ece8df").setFontWeight("bold");

  const priorityCell = sheet.getRange(rowIndex, 10);
  const priorityValue = priorityCell.getValue();

  if (priorityValue === "Горячий") {
    priorityCell.setBackground("#f3ddd7");
  } else if (priorityValue === "Теплый") {
    priorityCell.setBackground("#efe8d4");
  } else {
    priorityCell.setBackground("#e2e7df");
  }
}

function classifyPriority_(payload) {
  const goal = String(payload.goal || "").toLowerCase();
  const details = String(payload.details || "").toLowerCase();
  const contact = String(payload.contact || "");

  if (contact && (goal.includes("сроч") || details.includes("сроч") || details.includes("готов"))) {
    return "Горячий";
  }

  if (contact && (goal || details)) {
    return "Теплый";
  }

  return "Обычный";
}

function buildTelegramMessage_(payload, timestamp, rowIndex) {
  const dateLabel = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

  return [
    "Deus Forma - новая заявка",
    "",
    `Лид: #${rowIndex - 1}`,
    `Дата: ${dateLabel}`,
    `Имя: ${payload.name || "-"}`,
    `Цель: ${payload.goal || "-"}`,
    `Опыт: ${payload.experience || "-"}`,
    `Где тренироваться: ${payload.format || "-"}`,
    `Контакт: ${payload.contact || "-"}`,
    `Приоритет: ${classifyPriority_(payload)}`,
    "",
    "Детали:",
    payload.details || "-",
  ].join("\n");
}
