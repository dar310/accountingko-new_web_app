// Require:
var postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient("87209bb9-43dc-4e7e-b0ba-efc1c4b750e8");

client.sendEmail({
  "From": "dlrngo@mymail.mapua.edu.ph",
  "To": "darrenlewisngo@gmail.com",
  "Subject": "Hello from Postmark",
  "HtmlBody": "<strong>Hello</strong> dear Postmark user.",
  "TextBody": "Hello from Postmark!",
  "MessageStream": "outbound"
});