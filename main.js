import Papa from "papaparse";

document
  .querySelector(".csv-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false, // Disable automatic header detection
        complete: function (results) {
          const parsedData = results.data;
          // Remove the first element if it's empty (which can happen if the CSV file ends with a newline)
          if (
            parsedData.length > 0 &&
            parsedData[0].length === 1 &&
            parsedData[0][0] === ""
          ) {
            parsedData.shift();
          }
          // Send the parsed data to the background script
          chrome.runtime.sendMessage({ action: "uploadCSV", data: parsedData });
        },
      });
    }
  });
