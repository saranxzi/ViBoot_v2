const nav_bar_change = () => {
	let items_list = Array.from(document.getElementsByTagName("a")).filter(
		(e) => e.dataset.url
	);
	let marks, attendance, course_page, da_upload, time_table, calendar;
	for (let i = 0; i < items_list.length; i++) {
		item = items_list[i].innerText.trim();
		if (item.includes("Class Attendance")) {
			attendance = i;
		} else if (item.includes("Course Page")) {
			course_page = i;
		} else if (item.includes("Digital Assignment Upload")) {
			da_upload = i;
		} else if (item.includes("Time Table")) {
			time_table = i;
		} else if (item.includes("Calendar")) {
			calendar = i;
		} else if (item.includes("Marks")) {
			marks = i;
		}
	}
	// console.log(marks, attendance, course_page, da_upload, time_table, calendar);
	let nav = document.getElementsByClassName("collapse navbar-collapse");
	let span = document.createElement("div");
	span.id = "navbar";
	span.innerHTML = `
    <span class="navbar-text px-0 px-sm-2 mx-0 mx-sm-1 text-light" ></span>

    <button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_marks">Marks View</button>

    <button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_attendance">Attendance</button>

    <button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_course_page">Course Page</button>

    <button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_da_upload">DA Upload</button>
    `;
	if (time_table) {
		span.innerHTML += `<button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_timetable">Time Table</button>`;
	} else {
		span.innerHTML += `<button class="btn btn-primary border-primary shadow-none" type="button" style="background: rgba(13,110,253,0);border-style: none;" id="nav_btn_timetable">Calendar</button>`;
	}
	
	if (nav && nav.length > 0) {
		nav[0].insertBefore(span, nav[0].children[0]);
	} else {
		return; // Stop execution if there is no navbar on the page (e.g., logout page)
	}

	const clickHandler = (idx) => {
		const links = Array.from(document.getElementsByTagName('a')).filter((e) => e.dataset.url);
		if (links[idx]) {
			links[idx].click();
		}
	};

	document.getElementById("nav_btn_marks").addEventListener("click", () => clickHandler(marks));
	document.getElementById("nav_btn_attendance").addEventListener("click", () => clickHandler(attendance));
	document.getElementById("nav_btn_course_page").addEventListener("click", () => clickHandler(course_page));
	document.getElementById("nav_btn_da_upload").addEventListener("click", () => clickHandler(da_upload));
	document.getElementById("nav_btn_timetable").addEventListener("click", () => clickHandler(time_table));

	let buttons = span.querySelectorAll("button");
	buttons.forEach((button) => {
		button.addEventListener("click", () => {
			buttons.forEach((but) => {
				but.disabled = true;
				setTimeout(() => {
					buttons.forEach((btn) => {
						btn.disabled = false;
					});
				}, 1500);
			});
		});
	});
};

const clear_navbar = () => {
	document.getElementById("navbar").remove();
};

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
let flag = false;

chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "nav_bar_change") {
		try {
			if (
				document.getElementsByClassName("btn-group dropend")[0].style
					.backgroundColor === "red"
			) {
				document.getElementsByClassName("btn-group dropend")[0].remove();
			}
			if (
				document.getElementsByClassName(
					"btn btn-primary border-primary shadow-none"
				).length == 0 &&
				flag
			) {
				nav_bar_change();
			}
		} catch (error) {
			console.log(error);
		}
	}
});
if (
	document.getElementsByClassName("btn-group dropend")[0]?.style
		.backgroundColor === "red"
) {
	document.getElementsByClassName("btn-group dropend")[0].remove();
}
if (
	document.getElementsByClassName("btn btn-primary border-primary shadow-none")
		.length == 0
) {
	window.addEventListener("load", nav_bar_change, false);
	flag = true;
}

let input = document.createElement("input");
