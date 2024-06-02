import {
  clearAllEvents,
  clearAllTasks,
  convertToChartDataFormat,
  createEvents,
  createTasks,
  detectBreaker,
  getDriverTaskListId,
  getFormattedDates,
  getTasks,
  getUserInfo,
  removeSerialNoColumn,
  rowBreaker,
} from "./utils/utils";

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === "uploadCSV") {
    const csvData = request.data;

    chrome.identity.getAuthToken({ interactive: true }, async function (token) {
      const headers = new Headers({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      });
      const user = await getUserInfo(headers);
      console.log(user);
      if (!user.email.includes("@fuelbuddy")) {
        const tasklistID = await getDriverTaskListId(headers);
        await clearAllTasks(headers, tasklistID);
        const newTaskListId = await getDriverTaskListId(headers);

        const noSnoData = removeSerialNoColumn(csvData);
        const breaker = detectBreaker(noSnoData[1]);
        const formattedDataV1 = rowBreaker(noSnoData.slice(2), breaker);
        const { today, tomorrow } = getFormattedDates();
        const events = convertToChartDataFormat(
          formattedDataV1,
          today,
          tomorrow
        );

        console.log(newTaskListId);
        await clearAllEvents(headers);
        const tasks = getTasks(events);

        // Adding events
        const eventResults = await createEvents(events, headers);
        console.log(eventResults.length + " events added.");

        // Adding tasks
        const taskResults = await createTasks(tasks, newTaskListId, headers);
        console.log(taskResults.length + " tasks added.");
      }
    });
  }
});

//////////////////////////////////////////////
/////            Utils
//////////////////////////////////////////////

/////            APIs
//////////////////////////////////////////////

//For clearing the events
// async function clearAllEvents(headers) {
//   try {
//     await fetch(
//       "https://www.googleapis.com/calendar/v3/calendars/primary/clear",
//       {
//         method: "POST",
//         headers: headers,
//       }
//     );
//   } catch (error) {
//     console.error("Error while clearing the events : ", error);
//   }
// }

// // For clearing task in a list
// async function clearAllTasks(headers, tasklist) {
//   try {
//     const res = await fetch(
//       `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklist}`,
//       {
//         method: "DELETE",
//         headers: headers,
//       }
//     );
//     // const data = await res.json();
//     console.log(res);
//   } catch (error) {
//     console.error("Error while clearing the tasks : ", error);
//   }
// }

// // get all the taskLists
// async function getAllLists(headers) {
//   try {
//     const response = await fetch(
//       "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
//       {
//         method: "GET",
//         headers: headers,
//       }
//     );
//     const data = await response.json();
//     console.log(data, "getAllLists");
//     return data.items;
//   } catch (error) {
//     console.error("Error while clearing the tasks : ", error);
//   }
// }

// // create the tasList
// async function createList(headers) {
//   try {
//     const payload = {
//       title: "Driver Tasks",
//     };
//     const res = await fetch(
//       "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
//       {
//         method: "POST",
//         headers: headers,
//         body: JSON.stringify(payload),
//       }
//     );
//     const data = await res.json();
//     return data.id;
//   } catch (error) {
//     console.error("Error while creating the taskList : ", error);
//   }
// }

// async function getDriverTaskListId(headers) {
//   const taskLists = await getAllLists(headers);
//   console.log(taskLists);
//   const [driverTaskList] = taskLists?.filter(
//     (list) => list.title === "Driver Tasks"
//   );
//   if (driverTaskList) {
//     console.log(driverTaskList.id);
//     return driverTaskList.id;
//   } else {
//     const newTaskListId = await createList(headers);
//     console.log(newTaskListId);
//     return newTaskListId;
//   }
// }

// async function getUserInfo(headers) {
//   try {
//     const userInfoResponse = await fetch(
//       "https://www.googleapis.com/userinfo/v2/me",
//       {
//         headers,
//       }
//     );
//     const userInfo = await userInfoResponse.json();
//     return userInfo;
//   } catch (error) {
//     console.log("error getting user info  : ", error);
//   }
// }

// // --------- API END -----------

// function detectBreaker(headers) {
//   const emptyStringIndex = headers.findIndex((header) => header === "");
//   return emptyStringIndex !== -1
//     ? emptyStringIndex
//     : alert("Wrong data format, No empty column present between two shifts");
// }

// function removeSerialNoColumn(data) {
//   const result = data.map((i) => i.slice(1));
//   return result;
// }

// function rowBreaker(data, breakerIndex) {
//   const formattedArray = data
//     .map((row) => {
//       const shift1 = row.slice(0, breakerIndex);
//       // adding shift no property
//       shift1.unshift({ shiftNo: 1 });
//       const shift2 = [...row.slice(0, 5), ...row.slice(breakerIndex + 1)];
//       // adding shift no property
//       shift2.unshift({ shiftNo: 2 });
//       return [shift1, shift2];
//     })
//     .flat(1);

//   return formattedArray;
// }

// function extractProjectTimes(input) {
//   // Regular expression to match times with optional hyphen or other dashes
//   const timeRegex = /(\d{1,2}:\d{2})\s*[-–—]?\s*(\d{1,2}:\d{2})/;
//   const match = input.match(timeRegex);

//   if (match) {
//     const startTime = match[1];
//     const endTime = match[2];
//     const clientName = input.replace(timeRegex, "").replace(/[()]/g, "").trim();
//     return { clientName, startTime, endTime };
//   } else {
//     console.log(input);
//     alert("Time in not listed in the correct format");
//   }
// }

// /**
//     @param(date1) => todays Date
//     @param(date2) => tommorows Date
//     @param(data) => formatted data from the rowBreaker function
//     */

// function convertToChartDataFormat(data, date1, date2) {
//   //removing array which has no. driver names
//   // driver name is stored at the 8th index
//   const dataV1 = data.filter((i) => i[8].trim().length > 0);
//   //if driver name is there but no projects or depot filling
//   const dataV2 = dataV1.filter((row) => {
//     // Extract the project fields (assuming projects start at index 9)
//     const projects = row.slice(9);
//     // Filter out empty strings and "Depot Filling"
//     const validProjects = projects.filter(
//       (project) =>
//         project && !project.includes("Depot") && !project.includes("Filling")
//     );
//     // Check if the valid projects length is greater than 1
//     return validProjects.length > 0;
//   });

//   // removing empty projects
//   const dataV3 = dataV2.map((row) => {
//     // Remove empty strings and invalid projects from the row
//     const projects = row.slice(9);
//     const validProjects = projects.filter((project) => project);
//     // Rebuild the row with the valid projects
//     return [...row.slice(0, 9), ...validProjects];
//   });

//   const dataV4 = dataV3
//     .map((row) => {
//       const orderShifts = row.slice(9).map((project) => {
//         const { clientName, startTime, endTime } = extractProjectTimes(project);
//         // if the order lies in the other date
//         if (
//           row[0].shiftNo === 2 &&
//           Number(row[7].slice(0, 2)) > Number(startTime.slice(0, 2))
//         ) {
//           return {
//             summary: `${clientName}`,
//             description: `Driver Assigned : ${row[8].trim()} \n
//               Truck Assigned : ${row[2]}`,

//             start: {
//               dateTime: `${date2}T${startTime}:00`,
//               timeZone: "Asia/Dubai",
//             },
//             end: {
//               dateTime: `${date2}T${endTime}:00`,
//               timeZone: "Asia/Dubai",
//             },
//           };
//         }

//         // if the endtime of the order lies in the nextday
//         if (Number(startTime.slice(0, 2)) > Number(endTime.slice(0, 2))) {
//           return {
//             summary: `${clientName}`,
//             description: `Driver Assigned : ${row[8].trim()} \n
//               Truck Assigned : ${row[2]}`,

//             start: {
//               dateTime: `${date1}T${startTime}:00`,
//               timeZone: "Asia/Dubai",
//             },
//             end: {
//               dateTime: `${date2}T${endTime}:00`,
//               timeZone: "Asia/Dubai",
//             },
//           };
//         }

//         // if the order lies in the present date
//         return {
//           summary: `${clientName}`,
//           description: `Driver Assigned : ${row[8].trim()} \n
//             Truck Assigned : ${row[2]}`,

//           start: {
//             dateTime: `${date1}T${startTime}:00`,
//             timeZone: "Asia/Dubai",
//           },
//           end: {
//             dateTime: `${date1}T${endTime}:00`,
//             timeZone: "Asia/Dubai",
//           },
//         };
//       });
//       return orderShifts;
//     })
//     .flat(1);

//   return dataV4;
// }

// function getTasks(events) {
//   const tasks = events.map((event) => {
//     return {
//       title: event.summary,
//       due: `${event.end.dateTime}+04:00`,
//       notes: event.description,
//     };
//   });
//   return tasks;
// }

// // function to get today's and tomorrow's date
// function getFormattedDates() {
//   const today = new Date();
//   const tomorrow = new Date(today);
//   tomorrow.setDate(tomorrow.getDate() + 1);

//   const formatDate = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   return {
//     today: formatDate(today),
//     tomorrow: formatDate(tomorrow),
//   };
// }

// async function processInBatchesWithDelay(items, batchSize, delay, callback) {
//   const results = [];
//   for (let i = 0; i < items.length; i += batchSize) {
//     const batch = items.slice(i, i + batchSize);
//     const batchResults = await Promise.all(batch.map(callback));
//     results.push(...batchResults);
//     if (i + batchSize < items.length) {
//       await new Promise((res) => setTimeout(res, delay));
//     }
//   }
//   return results;
// }
// async function createEvents(events, headers) {
//   return processInBatchesWithDelay(events, 3, 0, async (event) => {
//     const response = await fetch(
//       "https://www.googleapis.com/calendar/v3/calendars/primary/events",
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify(event),
//       }
//     );
//     return response.json();
//   });
// }

// async function createTasks(tasks, newTaskListId, headers) {
//   return processInBatchesWithDelay(tasks, 2, 3000, async (task) => {
//     const response = await fetch(
//       `https://tasks.googleapis.com/tasks/v1/lists/${newTaskListId}/tasks`,
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify(task),
//       }
//     );
//     if (!response.ok) {
//       throw new Error("Network response was not ok " + response.statusText);
//     }
//     return response.json();
//   });
// }

// ///////////////////
// // End-points
// ///////////////////

// /*
//   1. For inserting a particular tasklist
//   POST https://tasks.googleapis.com/tasks/v1/users/@me/lists

//   2. For getting the existing list
//   GET https://tasks.googleapis.com/tasks/v1/users/@me/lists

// */
