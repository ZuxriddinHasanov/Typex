import { LanguageSchema } from "@typeuz/schemas/languages";
import { ModeSchema } from "@typeuz/schemas/shared";
import { Accessor, createSignal, Setter } from "solid-js";
import { z } from "zod";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { getSnapshot } from "./snapshot";

export const pageSize = 50;

export type LeaderboardType = Selection["type"];
const XpSelection = z.object({
  type: z.literal("weekly"),
  friendsOnly: z.boolean().optional().default(false),
  previous: z.boolean().optional().default(false),
  language: z.any().optional(),
  mode: z.any().optional(),
  mode2: z.any().optional(),
  numbers: z.any().optional(),
});
const SpeedSelection = z.object({
  type: z.enum(["daily", "weekly", "monthly", "allTime"]),
  friendsOnly: z.boolean().optional().default(false),
  previous: z.boolean().optional().default(false),
  mode: ModeSchema.optional().default("time"),
  mode2: z.string().optional().default("15"),
  language: LanguageSchema.optional().default("english"),
  numbers: z.boolean().optional(),
});

export const SelectionSchema = SpeedSelection.or(XpSelection);
export type Selection = z.infer<typeof SelectionSchema>;

export const LeaderboardUrlParamsSchema = z
  .object({
    type: z.enum(["allTime", "daily", "weekly", "monthly"]),
    mode: ModeSchema.optional(),
    mode2: z.string().optional(),
    language: LanguageSchema.optional(),
    numbers: z.boolean().optional(),
    yesterday: z.boolean().optional(),
    lastWeek: z.boolean().optional(),
    friendsOnly: z.boolean().optional(),
    page: z.number().optional(),
    goToUserPage: z.boolean().optional(),
  })
  .partial();
export type LeaderboardUrlParams = z.infer<typeof LeaderboardUrlParamsSchema>;

const [getSelectionLs, setSelection] = lsSelection();
export const [getPage, setPage] = createSignal(0);
export const [getGoToUserPage, setGoToUserPage] = createSignal(false);

if (
  getSelectionLs().friendsOnly &&
  (getSnapshot() === undefined ||
    !getServerConfiguration()?.connections.enabled)
) {
  setSelection((old) => ({ ...old, friendsOnly: false }));
}

export const getSelection = (): Selection => {
  return getSelectionLs();
};

export { setSelection };

export function readLeaderboardGetParameters(
  params: LeaderboardUrlParams | undefined,
): void {
  if (params === undefined || params.type === undefined) return;

  let newSelection: Partial<Selection> = {
    type: params.type,
    friendsOnly: params.friendsOnly ?? false,
  };

  if (params.type === "weekly") {
    newSelection.previous = params.lastWeek ?? false;
  } else {
    newSelection.mode = params.mode ?? "time";
    newSelection.mode2 = params.mode2 ?? "15";
    newSelection.language = params.language ?? "english";
    newSelection.numbers = params.numbers;
    newSelection.previous =
      params.type === "daily" && (params.yesterday ?? false);
  }

  setSelection({ ...getSelection(), ...newSelection } as Selection);

  if (params.goToUserPage === true) {
    setGoToUserPage(true);
  } else if (params.page !== undefined) {
    setPage(Math.max(0, params.page - 1));
  }
}

export function updateGetParameters(
  selection: Selection,
  pageNumber: number,
): void {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set("type", selection.type);

    if (selection.type !== "weekly") {
      if (typeof selection.mode === "string" && selection.mode.length > 0) {
        searchParams.set("mode", selection.mode);
      }
      if (typeof selection.mode2 === "string" && selection.mode2.length > 0) {
        searchParams.set("mode2", selection.mode2);
      }
      if (typeof selection.language === "string" && selection.language.length > 0) {
        searchParams.set("language", selection.language);
      }
      if (selection.numbers) {
        searchParams.set("numbers", "true");
      }
    }

    if (pageNumber > 0) {
      searchParams.set("page", String(pageNumber + 1));
    }

    if (selection.type === "weekly" && selection.previous) {
      searchParams.set("lastWeek", "true");
    }
    if (selection.type === "daily" && selection.previous) {
      searchParams.set("yesterday", "true");
    }
    if (selection.friendsOnly) {
      searchParams.set("friendsOnly", "true");
    }

    const queryStr = searchParams.toString();
    const newUrl = queryStr.length > 0 ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  } catch (e) {
    console.error("Failed to update leaderboard URL params:", e);
  }
}

function lsSelection(): [Accessor<Selection>, Setter<Selection>] {
  return useLocalStorage<Selection>({
    key: "leaderboardSelector",
    schema: SelectionSchema as z.ZodType<Selection>,
    fallback: {
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      numbers: undefined,
      friendsOnly: false,
      previous: false,
    },
    migrate: (value) => {
      if (value === null || typeof value !== "object") {
        return {} as Selection;
      }
      const result = value as Selection;
      if ("lastWeek" in result) {
        delete result["lastWeek"];
        result.previous = true;
      } else if ("yesterday" in result) {
        delete result["yesterday"];
        result.previous = true;
      }

      if (result.type === "weekly") {
        delete result.mode;
        delete result.mode2;
        delete result.language;
        delete result.numbers;
      }
      return result;
    },
  });
}
