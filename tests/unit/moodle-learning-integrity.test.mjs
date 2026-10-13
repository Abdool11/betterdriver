import assert from "node:assert/strict";
import {
  isMoodleModuleComplete,
  isMoodleModuleLocked,
  pickMoodleDownloadFile,
} from "../../lib/moodle.ts";

const modules = [
  {
    id: 10,
    name: "Introduction",
    modname: "page",
    instance: 10,
    completionstate: 1,
    completionTracked: true,
  },
  {
    id: 11,
    name: "Video 1.1",
    modname: "page",
    instance: 11,
    completionstate: 0,
    completionTracked: true,
  },
  {
    id: 12,
    name: "Video 1.2",
    modname: "page",
    instance: 12,
    completionstate: 0,
    completionTracked: true,
  },
];

assert.equal(isMoodleModuleComplete(modules[0]), true, "Only Moodle state 1/2 marks a tracked module complete");
assert.equal(isMoodleModuleComplete(modules[1]), false, "An incomplete module must never inherit completion from a count");
assert.equal(isMoodleModuleLocked(modules, 1), false, "The first incomplete tracked module must remain available");
assert.equal(isMoodleModuleLocked(modules, 2), true, "A later module must stay locked until the prior tracked activity completes");

const untracked = {
  id: 13,
  name: "Reference material",
  modname: "resource",
  instance: 13,
  completionstate: 1,
  completionTracked: false,
};
assert.equal(isMoodleModuleComplete(untracked), false, "Untracked content cannot inflate programme completion");

assert.equal(
  pickMoodleDownloadFile([
    {
      type: "file",
      filename: "index.html",
      fileurl: "https://moodle.example.test/index.html",
      mimetype: "text/html",
    },
  ]),
  undefined,
  "A Moodle HTML wrapper must never be offered as an offline download"
);

assert.equal(
  pickMoodleDownloadFile([
    {
      type: "file",
      filename: "driver-guide.pdf",
      fileurl: "https://moodle.example.test/driver-guide.pdf",
      mimetype: "application/pdf",
    },
  ])?.filename,
  "driver-guide.pdf",
  "An approved PDF remains downloadable"
);

assert.equal(
  pickMoodleDownloadFile([
    {
      type: "file",
      filename: "lesson.mp4",
      fileurl: "https://moodle.example.test/lesson.mp4",
      mimetype: "video/mp4",
    },
  ])?.filename,
  "lesson.mp4",
  "An approved direct video remains downloadable"
);

console.log("BetterDriver learning-integrity regression assertions passed.");
