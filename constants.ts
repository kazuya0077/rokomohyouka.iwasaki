
// Google Drive Image IDs
export const IMAGE_IDS = {
  TWO_STEP: '1Ehdh59aAnE8WTl1ux09DUfxl0qj56o1q',
  SQUAT: '1PccA9V5HlFUg-PPvRPUTfRToEzrLjpgl',
  ONE_LEG: '1-fDLR8-zBu8ShoPNEUXvpRmACKP3ty4W',
  LOCOMO_DEGREE: '1lCKgllFm3RsE9PQlZGQmGuxLZSVDuSMk',
  CRITERIA: '1uShW0Fb6Lu0GCHxmRNx8aIn-8FrCDPhu',
  FOOD: '19RGO251loIUZTMFfOham9uVX69r7tUnb',
  STAND_UP: '1tcgeh4MCjzQ57PVwCpaQSkU8LdpxeAMP',
};

// Helper to get viewable URL
// Changed logic to use the thumbnail API which is much more reliable for embedding than the export=view link.
// sz=w1200 ensures high resolution.
export const getDriveImageUrl = (id: string) => `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;

export const LOCOMO_25_QUESTIONS = [
  "1. 家の中で歩くこと",
  "2. ベッドや布団への寝起き",
  "3. 衣服の着脱（ズボンやパンツをはく、靴下をはくなど）",
  "4. 畳や床の掃除",
  "5. トイレの使用（洋式トイレで）",
  "6. 入浴（浴槽の出入り、体を洗うなど）",
  "7. 1リットル程度（牛乳パック1本分）の買い物を持ち帰る",
  "8. ボタンをかけたり、紐を結んだりすること",
  "9. 2kg程度（1リットルの牛乳パック2本分）の買い物を持ち帰る",
  "10. 15分くらい続けて歩くこと",
  "11. 横断歩道を青信号の間に渡りきること",
  "12. 家の階段を昇り降りすること",
  "13. 電車やバスを利用して外出すること",
  "14. タクシーを利用して外出すること",
  "15. 友人の家を訪ねること",
  "16. 銀行や郵便局に行くこと",
  "17. 近所へ買い物に行くこと",
  "18. 階段を使わずに1階から2階へ上がること（エレベーターなど）",
  "19. 10kg程度の重いものを持ち上げたり、運んだりすること",
  "20. 家の中の段差につまずくこと",
  "21. 階段を昇るのが大変なこと",
  "22. 速歩きをすること",
  "23. スポーツやダンスなどをすること",
  "24. 庭仕事や農作業をすること",
  "25. 旅行に行くこと"
];

export const LOCOMO_25_OPTIONS = [
  { value: 0, label: "困難でない" },
  { value: 1, label: "少し困難" },
  { value: 2, label: "かなり困難" },
  { value: 3, label: "極めて困難" },
  { value: 4, label: "できない" },
];

export const STAND_UP_OPTIONS = [
  { score: 8, label: "片脚で10cmから立てる", description: "【非常に良好】 片脚で最も低い台から立てる" },
  { score: 7, label: "片脚で20cmから立てる", description: "【十分な筋力】 片脚で低い台から立てる" },
  { score: 6, label: "片脚で30cmから立てる", description: "【良好】 片脚で中くらいの台から立てる" },
  { score: 5, label: "片脚で40cmから立てる", description: "【問題なし】 片脚で普通の椅子の高さから立てる" },
  { score: 4, label: "両脚で10cmから立てる", description: "【ロコモ度1】 片脚40cmは無理だが、両脚なら10cmから立てる" },
  { score: 3, label: "両脚で20cmから立てる", description: "【ロコモ度1】 両脚で低い台から立てる" },
  { score: 2, label: "両脚で30cmから立てる", description: "【ロコモ度2】 両脚で中くらいの台から立てる" },
  { score: 1, label: "両脚で40cmから立てる", description: "【ロコモ度3】 両脚で普通の椅子の高さからなら立てる" },
  { score: 0, label: "両脚で40cmから立てない", description: "【要相談】 自力での立ち上がりが困難" },
];
