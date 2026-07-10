let error_code = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let da_upload = true;
let da_page = async () => {
  let due_sync = [];
  da_upload = false;
  try {
    let reg_no, csrf;
    if (
      document.getElementsByClassName(
        "navbar-text text-light small fw-bold"
      )[0] != undefined
    ) {
      reg_no = document
        .getElementsByClassName("navbar-text text-light small fw-bold")[0]
        .innerText.replace("(STUDENT)", "")
        .trim();
    } else {
      reg_no = document
        .getElementsByClassName("VTopHeaderStyle")[0]
        .innerText.replace("(STUDENT)", "")
        .trim();
    }
    let table = document.getElementsByClassName("customTable")[0].children[0];
    let date = new Date().getTime();
    try {
      csrf = document.getElementsByName("_csrf")[3].defaultValue;
    } catch {}

    //Head Edit
    let table_head = document.getElementsByClassName("tableHeader");
    let edited_head = table_head[0].innerHTML.split("\n");
    edited_head.splice(5, 0, '<td style="width: 12%;">Upcoming Dues</td>');
    table_head[0].innerHTML = edited_head.join("");

    //body edit
    let rows = document.querySelectorAll(".tableContent");
    rows.forEach((row) => {
      let edited_row = row.innerHTML.split("\n");
      edited_row.splice(6, 0, '<td style="width: 12%;"></td>');
      row.innerHTML = edited_row.join("");
    });

    for (let i = 1; i < table.children.length; i++) {
      var classid = table.children[i].children[1].innerHTML;
      if (table.children[i].children[3].children.length != 1) {
        await fetch(
          `${window.location.origin}/vtop/examinations/processDigitalAssignment`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: `authorizedID=${reg_no}&x=${new Date().toGMTString()}&classId=${classid}&_csrf=${csrf}`,
          }
        )
          .then((res) => res.text())
          .then(async (data) => {
            var parser = new DOMParser();
            var doc = parser.parseFromString(data, "text/html");
            var table_inner = doc.getElementsByClassName(
              "fixedContent tableContent"
            );
            let course_code = doc.getElementsByClassName(
              "fixedContent tableContent"
            )[0].children[1].innerText;
            let course_title = doc.getElementsByClassName(
              "fixedContent tableContent"
            )[0].children[2].innerText;
            //   console.log(table_inner);
            var due_date = await new Promise((resolve) => {
              let due_dates = [];
              table_inner = Array.from(table_inner);
              table_inner.forEach((row) => {
                let date = row.childNodes[9].childNodes[1];
                let is_uploaded = true;
                try {
                  is_uploaded = row.children[6].children[0].innerHTML === "";
                } catch {}
                try {
                  if (date.style.color == "green" && is_uploaded) {
                    try {
                      let download_link = row.childNodes[11].childNodes;
                      due_dates.push({
                        date_due: date.innerHTML,
                        download_link:
                          download_link.length > 0
                            ? download_link[0]
                            : document.createElement("div"),
                        course_code: course_code,
                        course_title: course_title,
                      });
                    } catch {}
                  }
                } catch {}
              });
              if (due_dates.length > 0) {
                due_dates.sort((a, b) => {
                  return new Date(a.date_due) - new Date(b.date_due);
                });
                // console.log(due_dates);
                resolve(due_dates[0]);
              } else {
                resolve({
                  date_due: "Nothing Left.",
                  download_link: document.createElement("div"),
                  course_code: course_code,
                  course_title: course_title,
                });
              }
              due_sync.push(due_dates);
            }).then((data) => data);

            var due = new Date(due_date.date_due.replace(/-/g, " ")).getTime();
            var color =
              (due - date) / (3600 * 24 * 1000) <= 3
                ? "rgb(238, 75, 43,0.6)"
                : "rgb(170, 255, 0,0.6)";
            let days_left = Math.ceil((due - date) / (3600 * 24 * 1000));
            table.children[i].children[4].style.background = color;
            if (!isNaN(days_left)) {
              table.children[
                i
              ].children[4].innerHTML += `<span>${due_date.date_due}<br>(${days_left} days left)</span>`;
            } else {
              table.children[
                i
              ].children[4].innerHTML += `<span>${due_date.date_due}</span>`;
            }
            table.children[i].children[4].children[0].appendChild(
              due_date.download_link
            );
          })
          .catch((err) => console.log(err));
      }
    }
    // console.log(due_sync);
    sort();

    let sort_text_div = document.createElement("div");
    let sort_text = document.createElement("p");
    sort_text.style.color = "red";
    sort_text.innerHTML =
      "*Click on the Header (Sl. No,Course code..) of the table to sort";
    sort_text_div.appendChild(sort_text);
    document
      .getElementsByClassName("customTable")[0]
      .insertAdjacentElement("beforebegin", sort_text_div);

    da_upload = true;
  } catch (err) {
    // console.log(err);
  }
};


let sort_table = (n) => {
  let table = document.getElementsByTagName("tbody")[0];
  let i,
    x,
    y,
    count = 0;
  let switching = true;
  let direction = "ascending";

  while (switching) {
    switching = false;
    var rows = table.rows;

    //Loop to go through all rows
    for (i = 1; i < rows.length - 1; i++) {
      var Switch = false;

      // Fetch 2 elements that need to be compared
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      let x_due, y_due;
      if (n == 4) {
        x_due = parseInt(x.children[0].innerHTML.split("(")[1]);
        y_due = parseInt(y.children[0].innerHTML.split("(")[1]);
        if (isNaN(x_due)) {
          x_due = -1;
        }
        if (isNaN(y_due)) {
          y_due = -1;
        }
      }
      // Check the direction of order
      if (direction == "ascending") {
        // Check if 2 rows need to be switched
        if (
          x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase() &&
          [1, 2, 3, 5, 6].includes(n)
        ) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        } else if (
          n == 0 &&
          parseInt(x.innerHTML.toLowerCase()) >
            parseInt(y.innerHTML.toLowerCase())
        ) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        } else if (n == 4 && x_due > y_due) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        }
      } else if (direction == "descending") {
        // Check direction
        if (
          x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase() &&
          [1, 2, 3, 5, 6].includes(n)
        ) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        } else if (
          n == 0 &&
          parseInt(x.innerHTML.toLowerCase()) <
            parseInt(y.innerHTML.toLowerCase())
        ) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        } else if (n == 4 && x_due < y_due) {
          // If yes, mark Switch as needed and break loop
          Switch = true;
          break;
        }
      }
    }
    if (Switch) {
      // Function to switch rows and mark switch as completed
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;

      // Increase count for each switch
      count++;
    } else {
      // Run while loop again for descending order
      if (count == 0 && direction == "ascending") {
        direction = "descending";
        switching = true;
      }
    }
  }
};

let sort = () => {
  let head_change = Array.from(
    document.getElementsByClassName("tableHeader")[0].children
  );
  for (let i = 0; i < head_change.length - 1; i++) {
    head_change[i].addEventListener("click", () => {
      sort_table(i);
    });
  }
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "da_upload") {
    try {
      if (da_upload && document.getElementById("semesterSubId")) da_page();
    } catch (error) {
      // console.log(error);
    }
  }
});
