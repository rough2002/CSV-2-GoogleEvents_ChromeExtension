import {
  clearAllEvents,
  clearAllTasks,
  createEventsPromises,
  createTasksPromises,
  getDriverTaskListId,
  getUserInfo,
} from "./utils/utils";

import {
  constructScheduleMap,
  filteredClients,
  findSlotFrame,
  generateEvents,
  generateTasks,
  joinSlotsWithClient,
} from "./utils/utils2";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
        await clearAllEvents(headers);
        const newTaskListId = await getDriverTaskListId(headers);
        console.log(csvData[0]);
        const slotFrame = findSlotFrame(csvData[0], 8);
        console.log(slotFrame, "slotFrame");
        const filteredData = filteredClients(csvData);
        console.log(filteredData);
        const dataV1 = joinSlotsWithClient(filteredData, slotFrame);
        console.log(dataV1);
        const scheduleMap = constructScheduleMap(dataV1.slice(1));
        console.log(scheduleMap);
        const eventsObjects = generateEvents(scheduleMap);
        console.log(eventsObjects, "event Objects");
        const taskObjects = generateTasks(eventsObjects);
        console.log(taskObjects, "task Objects");
        const [taskResults, eventResults] = await Promise.all([
          createTasksPromises(taskObjects, newTaskListId, headers),
          createEventsPromises(eventsObjects, headers),
        ]);

        console.log(taskResults.length + " tasks added.");
        console.log(eventResults.length + " events added.");

        // const { today, tomorrow } = getFormattedDates(csvData.slice(0, 1)[0]);
        // const noSnoData = removeSerialNoColumn(csvData);
        // const breaker = detectBreaker(noSnoData[1]);
        // const formattedDataV1 = rowBreaker(noSnoData.slice(2), breaker);
        // // const { today, tomorrow } = getFormattedDates();
        // const events = convertToChartDataFormat(
        //   formattedDataV1,
        //   today,
        //   tomorrow
        // );

        // console.log(newTaskListId);
        // await clearAllEvents(headers);
        // const tasks = getTasks(events);

        // // Adding tasks
        // const taskResults = await createTasks(tasks, newTaskListId, headers);
        // console.log(taskResults.length + " tasks added.");

        // // Adding events
        // const eventResults = await createEvents(events, headers);
        // console.log(eventResults.length + " events added.");
      }
    });
  }
});
