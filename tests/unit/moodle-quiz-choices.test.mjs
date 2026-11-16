// Run through the repository's esbuild-backed unit runner (extensionless TS imports).
// Verifies mod_quiz_get_attempt_data question-choice extraction against real
// Moodle Boost markup — no live Moodle calls.
import assert from "node:assert/strict";

process.env.MOODLE_URL = "https://moodle.example.test/lms";
process.env.MOODLE_TOKEN = "FAKE_SERVICE_SECRET_123";
process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID = "101";
process.env.MOODLE_ECO_DRIVER_COURSE_ID = "102";

const { moodleGetAttemptData } = await import("../../lib/moodle.ts");

const originalFetch = globalThis.fetch;

// Real Moodle 4.x/Boost multichoice markup: the option text lives in a
// <div id="{inputId}_label"> referenced by aria-labelledby, with an
// <span class="answernumber">a. </span> badge — no <label> element at all.
const boostChoiceHtml = `<div class="que multichoice deferredfeedback">
  <div class="qtext"><p>Fuel gap between best and worst driver?</p></div>
  <fieldset class="ablock"><div class="answer">
    <div class="r0"><input type="radio" name="q211:1_answer" value="0" id="q211:1_answer0" aria-labelledby="q211:1_answer0_label" /><div class="d-flex w-auto" id="q211:1_answer0_label" data-region="answer-label"><span class="answernumber">a. </span><div class="flex-fill ms-1">25&ndash;30%</div></div> </div>
    <div class="r1"><input type="radio" name="q211:1_answer" value="1" id="q211:1_answer1" aria-labelledby="q211:1_answer1_label" /><div class="d-flex w-auto" id="q211:1_answer1_label" data-region="answer-label"><span class="answernumber">b. </span><div class="flex-fill ms-1">5&ndash;10%</div></div> </div>
    <div class="r0"><input type="radio" name="q211:1_answer" value="2" id="q211:1_answer2" aria-labelledby="q211:1_answer2_label" /><div class="d-flex w-auto" id="q211:1_answer2_label" data-region="answer-label"><span class="answernumber">c. </span><div class="flex-fill ms-1">40&ndash;50%</div></div> </div>
    <div class="r1"><input type="radio" name="q211:1_answer" value="3" id="q211:1_answer3" aria-labelledby="q211:1_answer3_label" /><div class="d-flex w-auto" id="q211:1_answer3_label" data-region="answer-label"><span class="answernumber">d. </span><div class="flex-fill ms-1">10&ndash;15%</div></div> </div>
  </div><div id="q211:1_clearchoice"><input type="radio" name="q211:1_answer" id="q211:1_answer-1" value="-1" checked="checked" /><label for="q211:1_answer-1">Clear my choice</label></div></fieldset>
</div>`;

const legacyLabelHtml = `<div class="que multichoice">
  <div class="qtext"><p>Legacy markup question?</p></div>
  <div class="answer">
    <input type="radio" name="q9:2_answer" value="0" id="q9:2_answer0" /><label for="q9:2_answer0">First option</label>
    <input type="radio" name="q9:2_answer" value="1" id="q9:2_answer1" /><label for="q9:2_answer1">Second option</label>
  </div>
</div>`;

const selectHtml = `<div class="que multichoice">
  <div class="qtext"><p>Dropdown question?</p></div>
  <select name="q5:3_answer"><option value="-1">Choose…</option><option value="0">Alpha</option><option value="1">Beta</option></select>
</div>`;

const noInputHtml = `<div class="que multichoice"><div class="qtext"><p>No inputs in html at all</p></div></div>`;

const ATTEMPT = { id: 211, quiz: 5, userid: 9, attempt: 2, state: "inprogress", sumgrades: null };

globalThis.fetch = async (input) => {
  const url = String(input);
  assert.ok(url.includes("mod_quiz_get_attempt_data"), `unexpected fetch: ${url}`);
  return Response.json({
    attempt: ATTEMPT,
    questions: [
      { slot: 1, type: "multichoice", page: 0, html: boostChoiceHtml, sequencecheck: 1 },
      { slot: 2, type: "multichoice", page: 0, html: legacyLabelHtml, sequencecheck: 1 },
      { slot: 3, type: "multichoice", page: 0, html: selectHtml, sequencecheck: 1 },
      // API options as JSON string, HTML without inputs → API fallback applies
      {
        slot: 4,
        type: "multichoice",
        page: 0,
        html: noInputHtml,
        sequencecheck: 1,
        options: JSON.stringify({ answers: [{ id: 7, answer: "Only via API" }] }),
      },
      { slot: 5, type: "essay", page: 0, html: `<div class="que essay"><textarea name="q1:5_answer"></textarea></div>`, sequencecheck: 1 },
    ],
  });
};

try {
  const data = await moodleGetAttemptData(211, 0);
  assert.ok(data, "attempt data must resolve");
  assert.equal(data.questions.length, 5);

  const [boost, legacy, selectQ, apiOnly, essay] = data.questions;

  // Boost aria-labelledby markup: all four real choices, no clear-choice, no badges
  assert.deepEqual(
    boost.options?.answers,
    [
      { id: 0, text: "25&ndash;30%", fraction: 0 },
      { id: 1, text: "5&ndash;10%", fraction: 0 },
      { id: 2, text: "40&ndash;50%", fraction: 0 },
      { id: 3, text: "10&ndash;15%", fraction: 0 },
    ],
    "Boost _label markup must yield the four radio choices with submit values"
  );
  assert.ok(!boost.options.answers.some((a) => /^[a-z]\.\s/.test(a.text)), "answernumber badge must be stripped");

  // Legacy <label for> markup still works
  assert.deepEqual(legacy.options?.answers, [
    { id: 0, text: "First option", fraction: 0 },
    { id: 1, text: "Second option", fraction: 0 },
  ]);

  // <select> dropdown options parse, placeholder skipped
  assert.deepEqual(selectQ.options?.answers, [
    { id: 0, text: "Alpha", fraction: 0 },
    { id: 1, text: "Beta", fraction: 0 },
  ]);

  // API options only used when the HTML has no inputs
  assert.deepEqual(apiOnly.options?.answers, [{ id: 7, text: "Only via API", fraction: 0 }]);

  // Non-choice questions carry no options
  assert.equal(essay.options, undefined);

  // HTML-parsed choices win over API options when both exist (HTML is authoritative for submit values)
  globalThis.fetch = async () =>
    Response.json({
      attempt: ATTEMPT,
      questions: [{ slot: 1, type: "multichoice", page: 0, html: boostChoiceHtml, sequencecheck: 1, options: { answers: [{ id: 9999, answer: "DB id answer" }] } }],
    });
  const both = await moodleGetAttemptData(211, 0);
  assert.equal(both.questions[0].options.answers[0].id, 0, "HTML choice index must beat API DB id");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("moodle-quiz-choices: all assertions passed");
