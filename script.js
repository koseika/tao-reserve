import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig, LINE_ID } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MAX_MONTH_OFFSET = 1;
const DEFAULT_TIMES = ["15:00", "16:00", "17:00", "18:00", "19:00"];
const today = new Date();
let currentMonthOffset = 0;
const reservationCache = {};

const currentMonthEl = document.getElementById("currentMonth");
const calendarEl = document.getElementById("calendar");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const timePanel = document.getElementById("timePanel");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const timeButtons = document.getElementById("timeButtons");
const loadingMessage = document.getElementById("loadingMessage");

function getDisplayDate() { return new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1); }
function formatDateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
function formatJapaneseDate(month, day) { return `${month + 1}月${day}日`; }
function getMonthLabel(date) { return `${date.getFullYear()}年${date.getMonth() + 1}月`; }

async function getDayData(key) {
  if (reservationCache[key]) return reservationCache[key];
  try {
    const snapshot = await getDoc(doc(db, "availability", key));
    if (snapshot.exists()) {
      reservationCache[key] = snapshot.data();
      return reservationCache[key];
    }
  } catch (error) {
    console.error("Firestore読み込みエラー:", error);
    loadingMessage.textContent = "空き状況の読み込みに失敗しました。";
  }
  const defaultData = { status: "available", times: DEFAULT_TIMES };
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
  nextMonthButton.disabled = currentMonthOffset === MAX_MONTH_OFFSET;

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startBlankCount = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < startBlankCount; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const key = formatDateKey(year, month, day);
    const data = await getDayData(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day ${data.status === "available" ? "available-day" : "unavailable-day"}`;
    button.innerHTML = `<span class="day-number">${day}</span><span class="day-status">${data.status === "available" ? "○" : "×"}</span>`;
    if (data.status === "available") {
      button.addEventListener("click", () => showTimes(month, day, data.times || DEFAULT_TIMES));
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

prevMonthButton.addEventListener("click", () => { if (currentMonthOffset > 0) { currentMonthOffset--; renderCalendar(); } });
nextMonthButton.addEventListener("click", () => { if (currentMonthOffset < MAX_MONTH_OFFSET) { currentMonthOffset++; renderCalendar(); } });
renderCalendar();
