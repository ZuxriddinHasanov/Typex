import { CompletedEvent } from "@typeuz/schemas/results";

export function isTestTooShort(
  result: CompletedEvent,
  isGuest = false,
): boolean {
  const { mode, mode2, customText, testDuration, bailedOut } = result;

  const minLimit = isGuest ? 2 : 1;

  if (mode === "time") {
    const seconds = parseInt(mode2);

    const setTimeTooShort = seconds > 0 && seconds < minLimit;
    const infiniteTimeTooShort = seconds === 0 && testDuration < minLimit;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < minLimit
      : false;
    return setTimeTooShort || infiniteTimeTooShort || bailedOutTooShort;
  }

  if (mode === "words") {
    const wordCount = parseInt(mode2);

    const setWordTooShort = wordCount > 0 && wordCount < minLimit;
    const infiniteWordTooShort = wordCount === 0 && testDuration < minLimit;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < minLimit
      : false;
    return setWordTooShort || infiniteWordTooShort || bailedOutTooShort;
  }

  if (mode === "custom") {
    if (!customText) return true;
    const wordLimitTooShort =
      (customText.limit.mode === "word" ||
        customText.limit.mode === "section") &&
      customText.limit.value < minLimit;
    const timeLimitTooShort =
      customText.limit.mode === "time" && customText.limit.value < minLimit;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < minLimit
      : false;
    return wordLimitTooShort || timeLimitTooShort || bailedOutTooShort;
  }

  if (mode === "zen") {
    return testDuration < minLimit;
  }

  return false;
}
