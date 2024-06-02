document
  .querySelector(".csv-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const csvData = e.target.result;
        const rows = csvData.split(/\r?\n/);
        const parsedData = rows.map((row) => row.split(","));
        // Send the parsed data to the background script
        chrome.runtime.sendMessage({ action: "uploadCSV", data: parsedData });
      };
      reader.readAsText(file);
    }
  });
