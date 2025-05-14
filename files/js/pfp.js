let cropper;

const filePicker = document.getElementById("imagePicker");
const submitButton = document.getElementById("submitButton");

filePicker.addEventListener("change", e => {
	const reader = new FileReader();
	reader.addEventListener("loadend", () => {
		try {
			document.getElementsByClassName("cropper-container")[0].remove();
		} catch (e) {}
		try {
			document.getElementById("centerlol").remove();
		} catch (e) {}
		try {
			document.getElementById("image").remove();
		} catch (e) {}

		const woahDiv = document.createElement("div");
		woahDiv.innerHTML = `<img id="image" style="max-width:100%" src="${reader.result}">`;
		document.getElementById("fpContainer").appendChild(woahDiv);

		document.getElementById("uploadButton").style = "";

		launchCropper();
	});
	reader.readAsDataURL(filePicker.files[0]); 
});

submitButton.addEventListener("click", (e) => {
	submitButton.disabled = true;
	submitButton.innerText = "Uploading...";
	filePicker.style = "pointer-events: none";
	const imageDataURL = cropper.getCroppedCanvas({width:256,height:256}).toDataURL("image/png");
	const imageBin = atob(imageDataURL.split(",")[1]);
	const array = [];
	for (let i = 0; i < imageBin.length; i++) {
		array.push(imageBin.charCodeAt(i));
	}

	const file = new Blob([new Uint8Array(array)], {type: "image/png"});

	const formdata = new FormData();
	formdata.append("pfp", file);

	const xhr = new XMLHttpRequest();
	xhr.open("POST", "/update_pfp", true);
	xhr.onload = () => {
		if (xhr.status !== 200) {
			submitButton.disabled = false;
			submitButton.innerText = "Upload";
		} else {
			window.location.href = "/?p=105";
		}
	};

	xhr.send(formdata);
});

function launchCropper() {
	var $image = $('#image');

	$image.cropper({
		aspectRatio: 1/1,
		viewMode: 1,
		dragMode: "none",
		zoomOnTouch: false,
		zoomOnWheel: false,
		zoomable: false,
		crop: function(event) {
			
		}
	});
	
	// Get the Cropper.js instance after initialized
	cropper = $image.data('cropper');

	submitButton.disabled = false;
}