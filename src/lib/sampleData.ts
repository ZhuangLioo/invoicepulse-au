import { todayMidnight } from "./format";

export const TODAY = todayMidnight();

export function buildSampleCSV(asOf = TODAY) {
  const fmt = (offset: number | null | undefined) => {
    if (offset === null || offset === undefined) return "";
    const date = new Date(asOf);
    date.setDate(date.getDate() + offset);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const rows: Array<[string, string, string, string, string, number, number | null, number | null, number, number, number, number, string, string, string]> = [
    ["INV-1001", "Coastline Cafe Pty Ltd", "53004085260", "Dana", "accounts@coastlinecafe.com.au", -95, -81, null, 4200, 420, 4620, 0, "Sent", "14 days", "NSW"],
    ["INV-1002", "Coastline Cafe Pty Ltd", "53004085260", "Dana", "accounts@coastlinecafe.com.au", -146, -132, -96, 3100, 310, 3410, 3410, "Paid", "14 days", "NSW"],
    ["INV-1003", "Harbour Electrical", "51824753281", "Paula", "paula@harbourelec.com.au", -46, -32, null, 8800, 880, 9680, 0, "Sent", "14 days", "NSW"],
    ["INV-1004", "Harbour Electrical", "51824753281", "Paula", "paula@harbourelec.com.au", -124, -110, -113, 5400, 540, 5940, 5940, "Paid", "14 days", "NSW"],
    ["INV-1005", "Greenline Landscaping", "12345678901", "", "", -69, -55, null, 2650, 265, 2915, 0, "Sent", "14 days", "VIC"],
    ["INV-1006", "Greenline Landscaping", "12345678901", "", "", -172, -158, -105, 1800, 180, 1980, 1980, "Paid", "14 days", "VIC"],
    ["INV-1007", "Bayside Renovations", "90123456460", "Mark", "mark@baysidereno.com.au", -18, -4, null, 15400, 1540, 16940, 0, "Sent", "14 days", "QLD"],
    ["INV-1008", "Bayside Renovations", "90123456460", "Mark", "mark@baysidereno.com.au", -61, -47, -48, 9200, 920, 10120, 10120, "Paid", "14 days", "QLD"],
    ["INV-1009", "Pixel & Co Studio", "", "Sam", "hello@pixelco.com.au", -111, -97, null, 3600, 360, 3960, 0, "Overdue", "14 days", "VIC"],
    ["INV-1010", "Pixel & Co Studio", "", "Sam", "hello@pixelco.com.au", -197, -183, -126, 2400, 240, 2640, 2640, "Paid", "14 days", "VIC"],
    ["INV-1011", "Northern Plumbing Group", "29002589460", "Jo", "jo@northernplumb.com.au", -14, 0, null, 1250, 125, 1375, 0, "Sent", "14 days", "WA"],
    ["INV-1012", "Sunset Trading", "11111111111", "", "info@sunsettrading.com.au", -151, -137, null, 6700, 500, 7200, 0, "Overdue", "14 days", "SA"],
    ["INV-1013", "Sunset Trading", "11111111111", "", "info@sunsettrading.com.au", -236, -222, -141, 5200, 520, 5720, 5720, "Paid", "14 days", "SA"],
    ["INV-1014", "Acme Joinery", "", "Liam", "liam@acmejoinery.com.au", -36, null, null, 4900, 490, 5390, 0, "Sent", "", "NSW"],
    ["INV-1015", "Riverside Consulting", "38502874191", "Emma", "emma@riversideconsult.com.au", -11, 3, null, 7200, 720, 7920, 0, "Sent", "14 days", "ACT"],
    ["INV-1016", "Riverside Consulting", "38502874191", "Emma", "emma@riversideconsult.com.au", -87, -73, -75, 6400, 640, 7040, 7040, "Paid", "14 days", "ACT"],
    ["INV-1017", "Coastline Cafe Pty Ltd", "53004085260", "Dana", "accounts@coastlinecafe.com.au", -51, -37, null, 2900, 290, 3190, 0, "Overdue", "14 days", "NSW"],
    ["INV-1003", "Harbour Electrical", "51824753281", "Paula", "paula@harbourelec.com.au", -46, -32, null, 8800, 880, 9680, 0, "Sent", "14 days", "NSW"],
    ["INV-1018", "Outback Freight Co", "67009674021", "Ops Team", "ops@outbackfreight.com.au", -97, -83, null, 11200, 1120, 12320, 4000, "Sent", "14 days", "NT"],
    ["INV-1019", "Metro Cafe Supplies", "84111122061", "Kim", "kim@metrocafe.com.au", -6, 8, null, 980, 98, 1078, 0, "Sent", "14 days", "VIC"],
    ["INV-1020", "Greenline Landscaping", "12345678901", "", "", -43, -29, null, 3300, 330, 3630, 0, "Overdue", "14 days", "VIC"],
    ["INV-1021", "Sunset Trading", "11111111111", "", "info@sunsettrading.com.au", -186, -172, null, 8900, 890, 9790, 0, "Overdue", "14 days", "SA"],
    ["INV-1022", "Bluegum Builders", "75432198002", "Sam", "sam@bluegumbuild.com.au", -24, -10, null, 21500, 2150, 23650, 0, "Sent", "14 days", "QLD"],
    ["INV-1023", "Pixel & Co Studio", "", "Sam", "hello@pixelco.com.au", -78, -64, null, 5100, 510, 5610, 0, "Overdue", "14 days", "VIC"],
    ["INV-1024", "Draftwork Studio", "", "Alex", "alex@draftwork.com.au", -30, -16, null, 3000, 300, 3300, 0, "Draft", "14 days", "NSW"],
    ["INV-1025", "Cancelled Order Co", "", "Pat", "pat@cancelled.com.au", -40, -26, null, 2000, 200, 2200, 0, "Void", "14 days", "VIC"],
  ];

  const header = "Invoice No,Customer,ABN,Contact Name,Email,Invoice Date,Due Date,Paid Date,Amount (ex GST),GST,Total,Amount Paid,Status,Terms,State";
  const lines = rows.map((row) => {
    const [inv, customer, abn, contact, email, invOffset, dueOffset, paidOffset, exgst, gst, total, paid, status, terms, state] = row;
    return [inv, customer, abn, contact, email, fmt(invOffset), fmt(dueOffset), fmt(paidOffset), exgst, gst, total, paid, status, terms, state].join(",");
  });

  return [header, ...lines].join("\n");
}

export const SAMPLE_CSV = buildSampleCSV();

