const url =
  "https://www.google.com/maps/place/Lafuente+Lorenzo+S.A./@40.4276243,-3.6897011,17z/data=!3m1!5s0xd4228915eeccabb:0x1cc80ad33bc1ca9b!4m6!3m5!1s0xd4228915b5bfd75:0x77dd0669a0f7e315!8m2!3d40.4280246!4d-3.6887462!16s%2Fg%2F11bzt503jg?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D";

console.log("Testing coordinate extraction patterns:");
console.log("URL length:", url.length);
console.log("");

// Test the @ pattern (current working but wrong)
const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
console.log(
  "@ pattern match:",
  atMatch ? [parseFloat(atMatch[1]), parseFloat(atMatch[2])] : "No match"
);

// Test the !3d!4d pattern (what should work)
const preciseMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
console.log(
  "!3d!4d pattern match:",
  preciseMatch
    ? [parseFloat(preciseMatch[1]), parseFloat(preciseMatch[2])]
    : "No match"
);

// Test if URL contains the patterns
console.log("Contains @:", url.includes("@"));
console.log("Contains !3d:", url.includes("!3d"));
console.log("Contains !4d:", url.includes("!4d"));

// Manual search for !3d and !4d
const preciseIndex = url.indexOf("!3d");
if (preciseIndex !== -1) {
  const preciseSection = url.substring(preciseIndex, preciseIndex + 50);
  console.log("!3d section:", preciseSection);
}

// Test in data parameter
try {
  const urlObj = new URL(url);
  const dataParam = urlObj.searchParams.get("data");
  console.log("Data parameter exists:", !!dataParam);
  console.log("Data parameter length:", dataParam ? dataParam.length : 0);

  if (dataParam) {
    console.log("Data param contains !3d:", dataParam.includes("!3d"));
    const dataMatch = dataParam.match(/!3d(-?\d+\.?\d*).*?!4d(-?\d+\.?\d*)/);
    console.log(
      "Data param match:",
      dataMatch
        ? [parseFloat(dataMatch[1]), parseFloat(dataMatch[2])]
        : "No match"
    );
  }
} catch (e) {
  console.log("URL parsing error:", e.message);
}
