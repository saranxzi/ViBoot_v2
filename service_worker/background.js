let course = "";
let faculty_slot = "";
let module_wise = true;
let file_name = {};
let data = {};
let time_last = new Date();
let det_file_name = "table_name";

chrome.runtime.onMessage.addListener((request) => {
  console.log(request);

  if (request.message === "table_name") {
    det_file_name = "table_name";
    // console.log("table_name");
  }
  if (request.message === "fac_upload_name") {
    det_file_name = "fac_upload_name";
    // console.log("fac_upload_name");
  }
  if (request.message === "course-page-data") {
    data = request.data;
  }
  if (request.message === "assignment-page-data") {
    console.log("Request Recieved - Assignment");
    data = request.data;
  }
});

let set_time_last = (time) => {
  // console.;log(time);
  time_last = time;
};
/*Sends a message to the content script */
const returnMessage = (MessageToReturn) => {
  chrome.tabs.query({ active: true }, (tab) => {
    let i;
    for (i = 0; i < tab.length; i++) {
      if (tab[i].url.includes("vtop")) {
        break;
      }
    }
    chrome.tabs.sendMessage(tab[i].id || 0, {
      message: MessageToReturn,
    });
  });
};

//Trigger download from course_page
const trigger_download = (request) => {
  course = request.data.course;
  faculty_slot = request.data.faculty_slot;
  module_wise = request.data.module_wise;
  request.data.link_data.forEach((link) => {
    fetch(link.url, { method: "HEAD", credentials: "include" })
      .then((response) => {
        if (
          response.ok &&
          response.headers.get("Content-Type").includes("pdf")
        ) {
          // Only download if it's a PDF
          console.log(response.text);
          chrome.downloads.download({
            url: link.url,
            conflictAction: "uniquify",
          });
        } else {
          console.log("Skipping non-PDF file: ", link.url);
        }
      })
      .catch((error) => {
        console.error("Error fetching file: ", error);
      });
  });
};

//Change File Name for the file
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  console.log("Item");
  console.log(item);
  if (
    item.url.includes("vtop.vit.ac.in") ||
    item.url.includes("vtopcc.vit.ac.in")
  ) {

  let view;
  let fileUrlLower = item.url.toLowerCase();
    console.log(fileUrlLower);
  if (fileUrlLower.includes("examinations")) {
      view = "Assignment";
  } else if (fileUrlLower.includes("coursesyllabusdownload")) {
      view = "Syllabus";
  } else if (fileUrlLower.includes("downloadpdf")) {
      view = "Course";
  } else {
      view = "Unknown";
    }
    console.log(view);

    if (view == "Course") {
      let file_extension = item.filename.replace(/([^_]*_){8}/, "").split(".");
      file_extension = "." + file_extension[file_extension.length - 1];
      console.log(course);
      console.log(faculty_slot);
      if (course != "" && faculty_slot != "") {
        let filename ="VIT Downloads/" +course +"/" +faculty_slot +"/";
        if (data.link_data[0]["folder_title"] != undefined) {
          if (module_wise) filename += (data.link_data[0]["folder_title"] + "/" + data.link_data[0]["title"] + file_extension);
          else filename += (data.link_data[0]["title"] + file_extension);
        }
        else filename += item.filename;
        console.log(filename);
        suggest({
          filename: filename,
        });
        course = "";
        faculty_slot = "";
        console.log("Flag 1");
      } else suggest({ filename: "VIT Downloads/Other Downloads/" + item.filename });
    } else if (view == "Assignment") {
      console.log("Flag 2");
      let file_extension = item.filename.replace(/([^_]*_){8}/, "").split(".");
      file_extension = "." + file_extension[file_extension.length - 1];
      console.log(course);
      let file_name = course;
      if (item.url.includes("doDownloadQuestion")) file_name += " QP ";
      else if (item.url.includes("downloadSTudentDA")) file_name += " Submission ";
      else {
        suggest({ filename: "VIT Downloads/Other Downloads/Assignments/" + item.filename });
        return;
      }
      file_name+=item.filename.slice(-5, -4);
      suggest({ filename: "VIT Downloads/Other Downloads/Assignments/" + file_name+file_extension });
    } else if(view == "Syllabus"){
      console.log("Flag 3");
      let file_extension = item.filename.replace(/([^_]*_){8}/, "").split(".");
      file_extension = "." + file_extension[file_extension.length - 1];
      syllabus_course = item.filename.split("_")[1];
      suggest({ filename: "VIT Downloads/Other Downloads/Syllabus/" + syllabus_course +file_extension});
    }
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Fires after the completion of a request */
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    let link = details["url"];
    // console.log(link);
    time_last = new Date();
    set_time_last(time_last);
    if (link.indexOf("doStudentMarkView") !== -1) {
      returnMessage("mark_view_page");
    } else if (
      link.indexOf("processViewStudentAttendance") !== -1 ||
      link.indexOf("processBackAttendanceDetails") !== -1
    ) {
      returnMessage("view_attendance");
    } else if (link.indexOf("menu.js") !== -1 || link.indexOf("home") !== -1) {
      if (link.indexOf("menu.js") !== -1) await sleep(1500);
      returnMessage("nav_bar_change");
    } else if (link.indexOf("processViewStudentCourseDetail") !== -1) {
      returnMessage("course_page_change");
    } else if (
      link.indexOf("doDigitalAssignment") !== -1 ||
      link.indexOf("sweetalert.min.js") != -1 ||
      link.indexOf("glyphicons-halflings-regular.woff2") != -1
    ) {
      await sleep(750);
      returnMessage("da_upload");
    } else if (link.indexOf("vtopcc.vit.ac.in/vtop/vtopLogin") !== -1) {
      returnMessage("vtopcc_captcha");
    } else if (
      link.indexOf("vtop/doLogin") !== -1 ||
      link.indexOf("assets/img/favicon.png") !== -1 ||
      link.indexOf("goHomePage") !== -1
    ) {
      returnMessage("vtopcc_nav_bar");
    } else if (link.indexOf("doSearchExamScheduleForStudent") !== -1) {
      returnMessage("exam_schedule");
    } else if (link.indexOf("processViewTimeTable") !== -1) {
      returnMessage("time_table");
    }
  },
  {
    urls: ["*://vtop.vit.ac.in/*", "*://vtopcc.vit.ac.in/vtop/*"],
  }
);

const sendNotification = (slotName) => {
  chrome.storage.local.get([
    "viboot_smtp_enable",
    "viboot_smtp_server",
    "viboot_smtp_port",
    "viboot_smtp_sender",
    "viboot_smtp_password",
    "viboot_smtp_receiver",
    "viboot_ntfy_topic"
  ], (data) => {
    const message = `ViBoot auto-registered you for gymnasium slot: ${slotName}!`;

    if (data.viboot_ntfy_topic) {
      const topic = data.viboot_ntfy_topic.trim();
      if (topic) {
        fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: message,
          headers: { 'Title': 'ViBoot Gym Registration Successful' }
        }).catch(err => console.error('ntfy notification error:', err));
      }
    }

    const payload = {
      message: message,
      smtp: {
        enable: !!data.viboot_smtp_enable,
        server: data.viboot_smtp_server || 'smtp.gmail.com',
        port: parseInt(data.viboot_smtp_port) || 587,
        sender: data.viboot_smtp_sender || '',
        password: data.viboot_smtp_password || '',
        receiver: data.viboot_smtp_receiver || ''
      }
    };

    fetch('http://localhost:3000/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      // Local server is offline
    });
  });
};

//Fires the msg from script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message && request.message.course) {
    trigger_download(request);
  } else if (request.message === "send-notification") {
    sendNotification(request.data.slot);
  }
});

//Removes the inactivity of service worker
chrome.alarms.create({ periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(() => {
  let time_nw = new Date();
});
