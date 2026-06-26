// Tao Reserve 予約データ
// status: "available" = ○
// status: "unavailable" = ×
// times: 表示する開始時間
//
// 予約が入った日は status を "unavailable" にしてください。
// 17時以降だけ受付したい日は times を ["17:00", "18:00", "19:00"] にしてください。

const reservationData = {
  "2026-06-26": {
    status: "available",
    times: ["15:00", "16:00", "17:00", "18:00", "19:00"]
  },

  "2026-06-27": {
    status: "available",
    times: ["17:00", "18:00", "19:00"]
  },

  "2026-06-28": {
    status: "unavailable",
    times: []
  }
};
