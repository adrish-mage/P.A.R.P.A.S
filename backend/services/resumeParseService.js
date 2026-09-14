const matchingClient = require("./matchingClient");
async function parseResume({ documentText }) {
  if (typeof documentText !== "string" || !documentText.trim()) {
    const error = new Error("documentText is required");
    error.statusCode = 400;
    throw error;
  }
  if (documentText.length > 100000) {
    const error = new Error("documentText exceeds the maximum allowed length");
    error.statusCode = 400;
    throw error;
  }
  return matchingClient.parseDocument({
    documentText: documentText.trim(),
  });
}
module.exports = { parseResume };
