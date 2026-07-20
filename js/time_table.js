const get_time_table_details = () => {
	let details = {
		courseCode: [],
		courseTitle: [],
		slot: [],
		venue: [],
		facName: [],
		facSchool: [],
		allSlots: [],
	};
	let table_rows = document.getElementsByTagName("tbody")[0].children;
	for (let i = 2; i < table_rows.length - 2; i++) {
		let td = table_rows[i].children;
		let code_title = td[2].innerText.split("\n")[0].trim();
		let code = code_title.split("-")[0].trim();
		details.courseCode.push(code);

		let title = code_title.split("-")[1].trim();
		details.courseTitle.push(title);

		let slot_venue = td[7].innerText.replace(/(\r\n|\n|\r)/gm, "").split("-");
		let slot = slot_venue[0].trim();
		details.slot.push(slot);
		details.allSlots = details.allSlots.concat(slot.split("+"));

		let venue = slot_venue[1].trim();
		details.venue.push(venue);

		let facName_school = td[8].innerText
			.replace(/(\r\n|\n|\r)/gm, "")
			.split("-");
		let fac_name = facName_school[0].trim();
		details.facName.push(fac_name);

		let facSchool = facName_school[1].trim();
		details.facSchool.push(facSchool);
	}
	return details;
};

const changeObj = (details) => {
	let obj = {
		allSlots: details.allSlots,
		courseInfo: [],
	};
	for (let i = 0; i < details.courseCode.length; i++) {
		obj.courseInfo.push({
			courseCode: details.courseCode[i],
			courseTitle: details.courseTitle[i],
			slot: details.slot[i],
			facName: details.facName[i],
			facSchool: details.facSchool[i],
			venue: details.venue[i],
		});
	}
	return obj;
};

const copyBtn = (details) => {
	if (document.getElementById("copyTimetable")) return;
	
	let btn = document.createElement("button");
	btn.style.width = "max-content";
	btn.style.margin = "10px auto";
	btn.style.display = "block";
	btn.innerHTML = "Copy Time Table";
	btn.className = "btn btn-primary btn-block";
	btn.id = "copyTimetable";
	
	let facTable = document.getElementById("timeTableStyle");
	if (facTable) {
		facTable.insertAdjacentElement("afterend", btn);
	} else {
		let table = document.getElementsByClassName("table-responsive")[0];
		if (table) {
			table.insertAdjacentElement("beforebegin", btn);
		}
	}
	
	let obj = changeObj(details);
	btn.addEventListener("click", () => {
		let str = JSON.stringify(obj);
		let encoded = window.btoa(unescape(encodeURIComponent(str)));
		navigator.clipboard.writeText(encoded).then(() => {
			alert("Timetable copied to clipboard!");
		}).catch(err => {
			console.error("Failed to copy timetable: ", err);
		});
	});
};

chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "time_table") {
		try {
			const details = get_time_table_details();
			copyBtn(details);
		} catch (error) {
			console.log(error);
		}
	}
});
