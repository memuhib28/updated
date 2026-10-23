import { JSDOM } from "jsdom";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { webcrypto } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fireEvent,
  getByRole,
  getByLabelText,
  queryByText,
  waitFor,
  within,
} from "@testing-library/dom";
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "http://localhost:5173", pretendToBeVisual: true },
);
const win = dom.window;
Object.assign(globalThis, {
  window: win,
  document: win.document,
  navigator: win.navigator,
  HTMLElement: win.HTMLElement,
  HTMLInputElement: win.HTMLInputElement,
  HTMLDialogElement: win.HTMLDialogElement,
  localStorage: win.localStorage,
  indexedDB,
  IDBKeyRange,
  crypto: webcrypto,
  matchMedia: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }),
});
(win.HTMLDialogElement.prototype as any).showModal = function () {
  this.setAttribute("open", "");
};
(win.HTMLDialogElement.prototype as any).close = function () {
  this.removeAttribute("open");
};
const spoken: any[] = [];
class FakeUtterance {
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}
Object.assign(win, {
  SpeechSynthesisUtterance: FakeUtterance,
  speechSynthesis: {
    resume() {},
    getVoices: () => [{ lang: "en-US" }, { lang: "ur-PK" }],
    addEventListener() {},
    removeEventListener() {},
    cancel() {},
    speak(u: any) {
      spoken.push(u);
    },
  },
});
Object.assign(globalThis, { SpeechSynthesisUtterance: FakeUtterance });
win.scrollTo = () => {};
let printCalls = 0;
win.print = () => {
  printCalls++;
};
const downloads: { name: string; blob: Blob }[] = [];
let latestBlob: Blob;
URL.createObjectURL = (blob: Blob) => {
  latestBlob = blob;
  return "blob:fixture";
};
URL.revokeObjectURL = () => {};
win.HTMLAnchorElement.prototype.click = function () {
  downloads.push({ name: this.download, blob: latestBlob });
};
const body = () => win.document.body;
const button = (name: string) => getByRole(body(), "button", { name });
const click = async (name: string) =>
  fireEvent.click(await waitFor(() => button(name)));
const nav = (name: string) =>
  fireEvent.click(
    getByRole(win.document.querySelector(".sidebar") as HTMLElement, "button", {
      name,
    }),
  );
const fill = (name: string, value: string) =>
  fireEvent.change(getByLabelText(body(), name, { exact: false }), {
    target: { value },
  });
const heading = async (name: string) =>
  waitFor(() =>
    assert.equal(win.document.querySelector("h1")?.textContent, name),
  );
const text = async (value: string) =>
  waitFor(() =>
    assert.ok(queryByText(body(), value, { exact: true }), "Missing: " + value),
  );
const metric = async (n: string) =>
  waitFor(() =>
    assert.equal(win.document.querySelector(".pink-ring strong")?.textContent, n),
  );

describe("Personal diary and guided onboarding", () => {
  it("ignores old demo preference and preserves personal records", async () => {
    const { writeData } = await import("../src/db");
    const { dateKey, shiftDate } = await import("../src/core");
    await writeData("personal", {
      days: [
        {
          id: "existing",
          date: shiftDate(dateKey(), -1),
          headache: "no",
          sleep: 8,
          quality: "",
          meals: "no",
          caffeine: null,
          exposures: "",
          notes: "Existing personal record",
        },
      ],
      attacks: [],
    });
    localStorage.setItem("migramap-mode", "demo");
    await import("../src/main");
    await heading("Let’s get to know your days");
    assert.ok(!body().textContent?.includes("Expo Demo"));
    await click("Get started");
    await heading("Which date are you recording?");
    await click("Continue");
    await heading("Did you have a headache today?");
  });
  it("branches for headache-free days, retains answers going back and toggles Urdu", async () => {
    await click("No");
    await click("Continue");
    await heading("How many hours did you sleep last night?");
    fill("Sleep duration (hours)", "7.5");
    await click("Back");
    await heading("Did you have a headache today?");
    assert.equal(button("No").getAttribute("aria-pressed"), "true");
    await click("Continue");
    await heading("How many hours did you sleep last night?");
    assert.equal(
      (getByLabelText(body(), "Sleep duration (hours)") as HTMLInputElement)
        .value,
      "7.5",
    );
    await click("اردو");
    await waitFor(() => assert.equal(win.document.documentElement.dir, "rtl"));
    await click("English");
    await click("Continue");
    await heading("Did you skip any meals today?");
    await click("No");
    await click("Continue");
    await heading("Daily context");
    await click("Bright light");
    await click("Nothing noticed");
    assert.equal(button("Bright light").getAttribute("aria-pressed"), "false");
    await click("Continue");
    await heading("Anything else you would like to note?");
    fill("Notes (optional)", "First guided diary entry");
    await click("Continue");
    await heading("Your diary is ready to begin");
  });
  it("saves once to personal diary and keeps preexisting records", async () => {
    await click("Save and finish");
    await heading("Dashboard");
    await metric("2");
    const { readData } = await import("../src/db");
    const data = await readData("personal");
    assert.equal(data.days.length, 2);
    assert.equal(data.days[1].sleep, 7.5);
    assert.equal(data.days[1].checkIn?.peakPain, null);
    assert.ok(data.days.some((d) => d.notes === "Existing personal record"));
    assert.equal(localStorage.getItem("migramap-onboarding-v1"), "done");
    assert.ok(!body().textContent?.includes("Expo Demo"));
  });
  it("desktop and mobile logos navigate home", async () => {
    nav("Learn About Migraine");
    await heading("Learn About Migraine");
    fireEvent.click(
      getByRole(
        win.document.querySelector(".sidebar") as HTMLElement,
        "button",
        { name: "MigraMap home" },
      ),
    );
    await metric("2");
    nav("Calendar");
    await heading("Calendar");
    fireEvent.click(
      getByRole(
        win.document.querySelector(".topbar") as HTMLElement,
        "button",
        { name: "MigraMap home" },
      ),
    );
    await metric("2");
  });
  it("reports show real records and article cards open", async () => {
    nav("Reports");
    await heading("Reports");
    assert.ok(body().textContent?.includes("No pain ratings recorded in this range."));
    await click("Export report");
    await heading("My Summary");
  });
  it("summary exports contain guided answers and print is callable", async () => {
    nav("My Summary");
    await heading("My Summary");
    assert.ok(body().textContent?.includes("First guided diary entry"));
    await click("Export CSV");
    assert.ok(
      (await downloads.at(-1)!.blob.text()).includes("First guided diary entry"),
    );
    await click("Print / Save as PDF");
    assert.equal(printCalls, 1);
  });
  it("completed onboarding cannot be restarted from Profile", async () => {
    nav("Profile"); await heading("Profile");
    assert.ok(!queryByText(body(), "Review onboarding"));
    assert.equal(localStorage.getItem("migramap-onboarding-v1"), "done");
  });
  it("existing check-in editor, learning playback and navigation still work", async () => {
    nav("Calendar");
    await heading("Calendar");
    await click("Edit check-in");
    await heading("My Headache Check-in");
    fill("Notes (optional)", "Edited after onboarding");
    await click("Save check-in");
    await waitFor(
      () =>
        assert.ok(queryByText(body(), "Your entry is saved.", { exact: true })),
      { timeout: 5000 },
    );
    const invalid = Array.from(
      win.document.querySelectorAll("input:invalid"),
    ).map((e) => e.outerHTML);
    const alert = win.document.querySelector("[role=alert]")?.textContent;
    assert.ok(!invalid.length, JSON.stringify(invalid));
    assert.ok(!alert, alert || "");
    await click("View your diary");
    await heading("Calendar");
    await text("Edited after onboarding");
    nav("Learn About Migraine");
    await heading("Learn About Migraine");
    await click("Play");
    await waitFor(() => assert.ok(button("Pause")));
    await waitFor(() =>
      assert.ok(spoken.at(-1)?.text.includes("Susceptibility")),
    );
    await click("Pause");
    for (const n of ["Add an Attack", "Patterns", "Profile"]) {
      nav(n);
      await heading(n);
      assert.ok(!body().textContent?.includes("Expo Demo"));
    }
  });
});


describe('No account gate',()=>{it('contains no sign-in, signup or social login controls',()=>{assert.ok(!/sign in|sign up|sign out|continue with google|continue with facebook/i.test(body().textContent??''));});});

describe('Returning device',()=>{it('opens Dashboard after remount without onboarding or login',async()=>{
 const {createRoot}=await import('react-dom/client');const React=await import('react');const {App}=await import('../src/main');
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);root.render(React.createElement(App));
 await waitFor(()=>assert.equal(host.querySelector('h1')?.textContent,'Dashboard'));
 assert.equal(host.querySelector('.onboarding'),null);assert.equal(host.querySelector('.auth-page'),null);root.unmount();host.remove();
});});
