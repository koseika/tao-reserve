// Tao Reserve Firebase Edition Ver.3.5
// 予約ページ：設定と空き状況をFirestoreから読み込みます。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig, LINE_ID } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_SETTINGS = {
  reservationNoticeDays: 2,
  displayMonths: 2,
  startTime: "15:00",
  endTime: "19:00",
  intervalMinutes: 60
};

let settings = { ...DEFAULT_SETTINGS };
let currentMonthOffset = 0;
const today = stripTime(new Date());
const reservationCache = {};

const currentMonthEl = document.getElementById("currentMonth");
const calendarEl = document.getElementById("calendar");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const timePanel = document.getElementById("timePanel");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const timeButtons = document.getElementById("timeButtons");
const loadingMessage = document.getElementById("loadingMessage");

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isBeforeBookableDate(date) {
  const earliest = addDays(today, Number(settings.reservationNoticeDays || 0));
  return stripTime(date) < earliest;
}

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function generateDefaultTimes() {
  const start = timeToMinutes(settings.startTime || DEFAULT_SETTINGS.startTime);
  const end = timeToMinutes(settings.endTime || DEFAULT_SETTINGS.endTime);
  const interval = Number(settings.intervalMinutes || DEFAULT_SETTINGS.intervalMinutes);
  const times = [];

  for (let current = start; current <= end; current += interval) {
    times.push(minutesToTime(current));
  }

  return times;
}

async function loadSettings() {
  try {
    const ref = doc(db, "settings", "booking");
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      settings = { ...DEFAULT_SETTINGS, ...snapshot.data() };
    }
  } catch (error) {
    console.error("設定読み込みエラー:", error);
  }
}

function getDisplayDate() {
  return new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
}

function formatDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatJapaneseDate(month, day) {
  return `${month + 1}月${day}日`;
}

function getMonthLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

async function getDayData(key) {
  if (reservationCache[key]) return reservationCache[key];

  try {
    const ref = doc(db, "availability", key);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      reservationCache[key] = snapshot.data();
      return reservationCache[key];
    }
  } catch (error) {
    console.error("Firestore読み込みエラー:", error);
  }

  const defaultData = { status: "available", times: generateDefaultTimes() };
  reservationCache[key] = defaultData;
  return defaultData;
}

async function renderCalendar() {
  const date = getDisplayDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  currentMonthEl.textContent = getMonthLabel(date);
  calendarEl.innerHTML = "";
  timePanel.classList.add("hidden");
  loadingMessage.textContent = "空き状況を読み込んでいます。";

  prevMonthButton.disabled = currentMonthOffset === 0;
  nextMonthButton.disabled = currentMonthOffset >= Number(settings.displayMonths || 2) - 1;

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startBlankCount = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < startBlankCount; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const cellDate = new Date(year, month, day);
    const key = formatDateKey(year, month, day);
    const data = await getDayData(key);
    const blockedByNotice = isBeforeBookableDate(cellDate);
    const isAvailable = !blockedByNotice && data.status === "available";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `day ${isAvailable ? "available-day" : "unavailable-day"}`;

    button.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-status">${isAvailable ? "○" : "×"}</span>
    `;

    if (isAvailable) {
      button.addEventListener("click", () => showTimes(month, day, data.times || generateDefaultTimes()));
    } else {
      button.disabled = true;
    }

    calendarEl.appendChild(button);
  }

  loadingMessage.textContent = "";
}

function showTimes(month, day, times) {
  const dateText = formatJapaneseDate(month, day);
  selectedDateTitle.textContent = `${dateText}のご予約`;
  timeButtons.innerHTML = "";

  times.forEach((time) => {
    const message = `こんにちは。\n\n${dateText} ${time} のタオタントラセッションを希望します。\n\nお名前：\n\nよろしくお願いいたします。`;

    const link = document.createElement("a");
    link.className = "time-button";
    link.href = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(message)}`;
    link.textContent = time;

    timeButtons.appendChild(link);
  });

  timePanel.classList.remove("hidden");
  timePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

prevMonthButton.addEventListener("click", () => {
  if (currentMonthOffset > 0) {
    currentMonthOffset--;
    renderCalendar();
  }
});

nextMonthButton.addEventListener("click", () => {
  if (currentMonthOffset < Number(settings.displayMonths || 2) - 1) {
    currentMonthOffset++;
    renderCalendar();
  }
});

await loadSettings();
renderCalendar();
