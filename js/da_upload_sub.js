document.addEventListener("click", (event) => {
  let pageHeader = document.querySelector("#main-section > div > div > div > div > div.card-header.primaryBorderTop > strong");
  if (!pageHeader || pageHeader.innerText.trim() !== "Assignment Upload") {
    return;
  }

  let target = event.target;
  
  // Check if the clicked element is a download button (icon)
  if (target.tagName.toLowerCase() === "i" || target.tagName.toLowerCase() === "button") {
    let downloadCell = target.closest("td");
    if (!downloadCell) return; // Exit if not inside a cell

    let row = downloadCell.closest("tr"); // Get the table row
    if (!row) return;

    let courseTitle = document.querySelector("table tr:nth-child(2) td:nth-child(3)")?.innerText.trim();

    // Send message to background.js
    chrome.runtime.sendMessage({
      message: "assignment-page-data",
        data: {
            course: courseTitle,
            link: target.closest("a")?.href || target.closest("button")?.dataset?.link,
        }
    });
  }
});
