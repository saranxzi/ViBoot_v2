document.addEventListener("DOMContentLoaded", () => {
  const fields = {
    emailEnable: document.getElementById("email-enable"),
    smtpServer: document.getElementById("smtp-server"),
    smtpPort: document.getElementById("smtp-port"),
    senderEmail: document.getElementById("sender-email"),
    smtpPassword: document.getElementById("smtp-password"),
    receiverEmail: document.getElementById("receiver-email"),
    ntfyTopic: document.getElementById("ntfy-topic")
  };

  chrome.storage.local.get([
    "viboot_smtp_enable",
    "viboot_smtp_server",
    "viboot_smtp_port",
    "viboot_smtp_sender",
    "viboot_smtp_password",
    "viboot_smtp_receiver",
    "viboot_ntfy_topic"
  ], (data) => {
    fields.emailEnable.checked = !!data.viboot_smtp_enable;
    if (data.viboot_smtp_server) fields.smtpServer.value = data.viboot_smtp_server;
    if (data.viboot_smtp_port) fields.smtpPort.value = data.viboot_smtp_port;
    if (data.viboot_smtp_sender) fields.senderEmail.value = data.viboot_smtp_sender;
    if (data.viboot_smtp_password) fields.smtpPassword.value = data.viboot_smtp_password;
    if (data.viboot_smtp_receiver) fields.receiverEmail.value = data.viboot_smtp_receiver;
    if (data.viboot_ntfy_topic) fields.ntfyTopic.value = data.viboot_ntfy_topic;
  });

  document.getElementById("settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    chrome.storage.local.set({
      viboot_smtp_enable: fields.emailEnable.checked,
      viboot_smtp_server: fields.smtpServer.value,
      viboot_smtp_port: parseInt(fields.smtpPort.value) || 587,
      viboot_smtp_sender: fields.senderEmail.value,
      viboot_smtp_password: fields.smtpPassword.value,
      viboot_smtp_receiver: fields.receiverEmail.value,
      viboot_ntfy_topic: fields.ntfyTopic.value
    }, () => {
      const status = document.getElementById("save-status");
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    });
  });
});