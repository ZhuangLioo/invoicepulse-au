import { describe, expect, it } from "vitest";
import { addDays, csvEscape, daysBetween, fmtMoney, fmtMoneyExact, parseDate, parseNumber, toISODate } from "./format";

describe("parseDate", () => {
  it("parses ISO dates", () => {
    expect(parseDate("2026-05-15")).toEqual(new Date(2026, 4, 15));
    expect(parseDate("2026-5-1")).toEqual(new Date(2026, 4, 1));
  });

  it("parses ISO date-times by dropping the time part", () => {
    expect(parseDate("2026-05-15T10:30:00Z")).toEqual(new Date(2026, 4, 15));
  });

  it("parses AU numeric dates as day-first", () => {
    expect(parseDate("15/05/2026")).toEqual(new Date(2026, 4, 15));
    expect(parseDate("03/04/2026")).toEqual(new Date(2026, 3, 3)); // 3 April, never 4 March
    expect(parseDate("15-05-2026")).toEqual(new Date(2026, 4, 15));
    expect(parseDate("15.05.26")).toEqual(new Date(2026, 4, 15));
  });

  it("parses month-name dates", () => {
    expect(parseDate("5 Jun 2026")).toEqual(new Date(2026, 5, 5));
    expect(parseDate("05-Jun-2026")).toEqual(new Date(2026, 5, 5));
    expect(parseDate("5 June 2026")).toEqual(new Date(2026, 5, 5));
    expect(parseDate("Jun 5, 2026")).toEqual(new Date(2026, 5, 5));
  });

  it("rejects impossible dates instead of silently rolling over", () => {
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("2026-02-31")).toBeNull();
    expect(parseDate("32/01/2026")).toBeNull();
    expect(parseDate("15/13/2026")).toBeNull();
  });

  it("rejects unparseable input rather than guessing", () => {
    expect(parseDate("next week")).toBeNull();
    expect(parseDate("2026")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate(null)).toBeNull();
  });
});

describe("parseNumber", () => {
  it("parses plain and formatted amounts", () => {
    expect(parseNumber("1100")).toBe(1100);
    expect(parseNumber("$1,100.50")).toBe(1100.5);
    expect(parseNumber(" 1 100 ")).toBe(1100);
    expect(parseNumber(2500)).toBe(2500);
  });

  it("parses accounting negatives in parentheses", () => {
    expect(parseNumber("(1,100.00)")).toBe(-1100);
    expect(parseNumber("($550.25)")).toBe(-550.25);
  });

  it("parses trailing-minus negatives", () => {
    expect(parseNumber("1100-")).toBe(-1100);
  });

  it("strips currency prefixes", () => {
    expect(parseNumber("AUD 1100")).toBe(1100);
    expect(parseNumber("A$1,100")).toBe(1100);
  });

  it("returns null for unreadable values", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("n/a")).toBeNull();
    expect(parseNumber("12 Smith St")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
});

describe("money formatting", () => {
  it("rounds for display", () => {
    expect(fmtMoney(4620.5)).toBe("$4,621");
  });

  it("keeps cents for exports", () => {
    expect(fmtMoneyExact(4620.5)).toBe("4620.50");
    expect(fmtMoneyExact(null)).toBe("");
  });
});

describe("date helpers", () => {
  it("daysBetween and addDays round-trip", () => {
    const start = new Date(2026, 0, 1);
    expect(daysBetween(addDays(start, 14), start)).toBe(14);
  });

  it("toISODate uses local date, not UTC", () => {
    expect(toISODate(new Date(2026, 5, 10))).toBe("2026-06-10");
  });
});

describe("csvEscape", () => {
  it("quotes fields containing commas and quotes", () => {
    expect(csvEscape('Acme "Best" Pty, Ltd')).toBe('"Acme ""Best"" Pty, Ltd"');
    expect(csvEscape("plain")).toBe("plain");
  });
});
