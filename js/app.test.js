const {
  parseDurationText,
  formatViewsShort,
  normalizeRows,
} = require("./app.js");

describe("parseDurationText", () => {
  test("MM:SS", () => expect(parseDurationText("2:30")).toBe(150));
  test("seconds", () => expect(parseDurationText("45s")).toBe(45));
  test("HH:MM:SS", () => expect(parseDurationText("1:02:30")).toBe(3750));
  test("invalid", () => expect(parseDurationText("abc")).toBe(0));
});

describe("formatViewsShort", () => {
  test("millions", () => expect(formatViewsShort(1500000)).toBe("1.5M"));
  test("thousands", () => expect(formatViewsShort(45000)).toBe("45K"));
  test("small", () => expect(formatViewsShort(999)).toBe("999"));
});

describe("normalizeRows", () => {
  test("parses metrics and dates from mixed keys", () => {
    const rows = [
      {
        Views: "1,500",
        V30: "250",
        Duration: "2:30",
        Published_Date: "2023-06-01",
        Video_URL: "http://example.com",
        Creator: "Alice",
        Video_Title: "Hello world",
      },
    ];
    const normalized = normalizeRows(rows);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      views: 1500,
      v30: 250,
      dur: 150,
      title: "Hello world",
      url: "http://example.com",
      creator: "Alice",
    });
    expect(normalized[0].date).toBeInstanceOf(Date);
  });
});
