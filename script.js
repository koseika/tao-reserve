// Ver.0.6 予約ページMVP
// Googleスプレッドシート連携前の仮データ版です。

// TODO: ここを自分の公式LINEのURLに変更してください
const LINE_ID = "@656gnzam";

// 表示できる月数：今月と来月まで
const MAX_MONTH_OFFSET = 1;

// 通常の受付開始時間
const DEFAULT_TIMES = ["15:00", "16:00", "17:00", "18:00", "19:00"];

// 仮の予約データ
// status: "available" 予約可能 / "unavailable" 予約不可
// times: その日に表示する開始時間。省略するとDEFAULT_TIMESを表示。
const reservationData = {
  "2026-07-12": {
    status: "available",
    times: ["15:00", "16:00", "17:00", "18:00", "19:00"]
  },
  "2026-07-13": {
    status: "available",
    times: ["17:00", "18:00", "19:00"]
  },
  "2026-07-14": {
    status: "unavailable",
    times: []
  }
};

const today = new Date();
let currentMonthOffset = 0;

const currentMonthEl = document.getElementById("currentMonth");
const calendarEl = document.getElementById("calendar");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const timePanel = document.getElementById("timePanel");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const timeButtons = document.getElementById("timeButtons");

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

function renderCalendar() {
  const date = getDisplayDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  currentMonthEl.textContent = getMonthLabel(date);
  calendarEl.innerHTML = "";
  timePanel.classList.add("hidden");

  prevMonthButton.disabled = currentMonthOffset === 0;
  nextMonthButton.disabled = currentMonthOffset === MAX_MONTH_OFFSET;

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 月曜始まりに変換：月=0、火=1、日=6
  const startBlankCount = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < startBlankCount; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const key = formatDateKey(year, month, day);
    const data = reservationData[key] || { status: "available", times: DEFAULT_TIMES };

    const button = document.createElement("button");
    button.type = "button";
    button.className = `day ${data.status === "available" ? "available-day" : "unavailable-day"}`;

    button.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-status">${data.status === "available" ? "○" : "×"}</span>
    `;

    if (data.status === "available") {
      button.addEventListener("click", () => showTimes(month, day, data.times || DEFAULT_TIMES));
    } else {
      button.disabled = true;
    }

    calendarEl.appendChild(button);
  }
}

function showTimes(month, day, times) {
  const dateText = formatJapaneseDate(month, day);
  selectedDateTitle.textContent = `${dateText}のご予約`;
  timeButtons.innerHTML = "";

  times.forEach((time) => {
    const message = `こんにちは。\n\n${dateText}${time}からのタオタントラセッションを希望します。\n\nお名前：\n\nよろしくお願いいたします。`;
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
  if (currentMonthOffset < MAX_MONTH_OFFSET) {
    currentMonthOffset++;
    renderCalendar();
  }
});

renderCalendar();
