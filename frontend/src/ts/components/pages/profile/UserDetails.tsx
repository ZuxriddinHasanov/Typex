import {
  TypingStats as TypingStatsType,
  UserProfile,
  UserProfileDetails,
} from "@typeuz/schemas/users";
import {
  isToday as dateIsToday,
  isYesterday as dateIsYesterday,
  getCurrentDayTimestamp,
} from "@typeuz/util/date-and-time";
import { isSafeNumber } from "@typeuz/util/numbers";
import { differenceInDays } from "date-fns/differenceInDays";
import { formatDate } from "date-fns/format";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { For, JSXElement, Show } from "solid-js";

import { addConnection, hasConnection } from "../../../collections/connections";
import { Snapshot } from "../../../constants/default-snapshot";
import { bp } from "../../../states/breakpoints";
import { getUserId, isAuthenticated } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { showNoticeNotification } from "../../../states/notifications";
import { getLastResult } from "../../../states/snapshot";
import { t } from "../../../states/ui-language";
import { setUserToReport } from "../../../states/user-report";
import { secondsToString } from "../../../utils/date-and-time";
import { getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { AutoShrink } from "../../common/AutoShrink";
import { Balloon, BalloonProps } from "../../common/Balloon";
// import { Bar } from "../../common/Bar";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { Fa } from "../../common/Fa";
import { UserBadge } from "../../common/UserBadge";
import { UserFlags } from "../../common/UserFlags";
import { EditProfile } from "../../modals/EditProfileModal";

type Variant = "basic" | "hasSocials" | "hasBioOrKeyboard" | "full";

export function UserDetails(props: {
  profile: UserProfile;
  isAccountPage?: true;
}): JSXElement {
  const variant = () => {
    if (props.profile.banned) return "basic";

    const hasSocials = props.profile.details?.socialProfiles !== undefined;
    const hasBioOrKeyboard =
      (props.profile.details?.bio !== undefined &&
        props.profile.details?.bio !== "") ||
      (props.profile.details?.keyboard !== undefined &&
        props.profile.details?.keyboard !== "");
    if (!hasSocials && !hasBioOrKeyboard) return "basic";
    if (hasSocials && !hasBioOrKeyboard) return "hasSocials";
    if (!hasSocials && hasBioOrKeyboard) return "hasBioOrKeyboard";
    return "full";
  };

  return (
    <div class="relative w-full overflow-hidden rounded-xl border-2 border-sub-alt/50 bg-bg shadow-sm">
      <div class="relative z-10 flex flex-col gap-10 p-8 sm:p-12">
        {/* Top Section: Avatar, Name, and Badges */}
        <div class="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div class="flex items-center gap-6">
            <AvatarAndName
              profile={props.profile}
              variant={variant()}
              isAccountPage={props.isAccountPage}
            />
          </div>

          <div class="flex flex-wrap items-center gap-4">
            {/* Show action buttons like Edit Profile or Add Friend here */}
            <ActionButtons
              profile={props.profile}
              isAccountPage={props.isAccountPage}
            />
          </div>
        </div>

        {/* Divider */}
        <div class="h-px w-full bg-sub-alt/50"></div>

        {/* Bottom Section: Stats, Bio, Socials */}
        <div class="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
          <div class="flex flex-col gap-6 md:col-span-5">
            <Show
              when={variant() === "full" || variant() === "hasBioOrKeyboard"}
            >
              <BioAndKeyboard
                details={props.profile.details}
                variant={variant()}
              />
            </Show>
            <Show when={variant() === "full" || variant() === "hasSocials"}>
              <Socials
                socials={props.profile.details?.socialProfiles}
                variant={variant()}
              />
            </Show>
          </div>

          <div class="hidden place-self-center md:col-span-1 md:block">
            <div class="h-24 w-px bg-sub/10"></div>
          </div>

          <div class="flex justify-end md:col-span-6">
            <TypingStats
              typingStats={props.profile.typingStats}
              variant={variant()}
            />
          </div>
        </div>
      </div>

      <Show when={props.isAccountPage === true}>
        <EditProfile />
      </Show>
    </div>
  );
}

function ActionButtons(props: {
  profile: UserProfile;
  isAccountPage?: true;
}): JSXElement {
  const isUsersProfile = () =>
    props.profile.uid !== undefined &&
    props.profile.uid === (getUserId() ?? "");

  return (
    <>
      <Show
        when={props.isAccountPage === true}
        fallback={
          <>
            <Show when={!isUsersProfile()}>
              <button
                type="button"
                class="group flex items-center gap-2 rounded-md border border-sub-alt bg-sub-alt/30 px-4 py-2 text-sm font-medium text-sub shadow-none transition-colors hover:bg-sub-alt/60 hover:text-text"
                onClick={() => {
                  if (!isAuthenticated()) {
                    showNoticeNotification(
                      "Shikoyat yuborish uchun tizimga kirishingiz kerak",
                    );
                    return;
                  }
                  setUserToReport(props.profile);
                  showModal("UserReport");
                }}
              >
                <Fa icon="fa-flag" class="text-xs" />
                <span>{t("profile.report")}</span>
              </button>
            </Show>
          </>
        }
      >
        <button
          type="button"
          onClick={() => {
            if (props.profile.banned === true) {
              showNoticeNotification(
                "Ban qilingan foydalanuvchilar profilni tahrirlay olmaydi",
              );
              return;
            }
            showModal("EditProfile");
          }}
          class="group flex items-center gap-2 rounded-md bg-text px-6 py-2.5 text-sm font-bold text-bg transition-transform hover:scale-[1.02]"
        >
          <Fa
            icon="fa-cog"
            class="transition-transform group-hover:rotate-90"
          />
          <span>Sozlamalar & Tahrirlash</span>
        </button>
        <button
          type="button"
          onClick={() =>
            showNoticeNotification("Sertifikatlar tez orada qo'shiladi!")
          }
          class="group flex items-center gap-2 rounded-md border-2 border-sub-alt/50 bg-transparent px-6 py-2.5 text-sm font-bold text-text transition-colors hover:border-sub-alt hover:bg-sub-alt/20"
        >
          <Fa icon="fa-certificate" class="text-main" />
          <span>Sertifikatlar</span>
        </button>
        <button
          type="button"
          onClick={async () => {
            const { signOut } = await import("../../../auth");
            signOut();
          }}
          class="group flex items-center gap-2 rounded-md border-2 border-error/50 bg-transparent px-6 py-2.5 text-sm font-bold text-error transition-colors hover:border-error hover:bg-error/20"
        >
          <Fa icon="fa-sign-out-alt" />
          <span>Chiqish</span>
        </button>
      </Show>

      <button
        type="button"
        class="group flex items-center gap-2 rounded-md border-2 border-sub-alt/50 bg-transparent px-4 py-2.5 text-sm font-medium text-sub transition-colors hover:border-sub-alt hover:bg-sub-alt/20 hover:text-text"
        onClick={() => {
          const url = `${location.origin}/profile/${props.profile.name}`;
          navigator.clipboard.writeText(url).then(
            function () {
              showNoticeNotification(
                "Profil havolasi nusxalandi! 🔗 Do'stlaringizga ulashishingiz mumkin.",
              );
            },
            function () {
              alert(`Nusxalash imkoni bo'lmadi. Havola: ${url}`);
            },
          );
        }}
      >
        <Fa icon="fa-link" class="text-xs" />
        <span class="hidden sm:inline">Nusxalash</span>
      </button>
    </>
  );
}

function AvatarAndName(props: {
  profile: UserProfile;
  variant: Variant;
  isAccountPage?: true;
}): JSXElement {
  const accountAgeHint = () => {
    const creationDate = new Date(props.profile.addedAt);
    const diffDays = differenceInDays(new Date(), creationDate);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  const formatStreak = (length: number) =>
    `${length} ${length === 1 ? "day" : "days"}`;

  const extraStreakText = () => {
    if (!props.isAccountPage) return "";
    let hoverText = "";

    const lastResult = getLastResult();
    if (lastResult === undefined) return "";

    const streakOffset = (props.profile as Snapshot).streakHourOffset;

    const dayInMilis = 1000 * 60 * 60 * 24;

    let target = getCurrentDayTimestamp(streakOffset) + dayInMilis;
    if (target < Date.now()) {
      target += dayInMilis;
    }
    const timeDif = formatDistanceToNowStrict(target);

    if (lastResult !== undefined) {
      //check if the last result is from today
      const isToday = dateIsToday(lastResult.timestamp, streakOffset);
      const isYesterday = dateIsYesterday(lastResult.timestamp, streakOffset);

      const offsetString = isSafeNumber(streakOffset)
        ? `(${streakOffset > 0 ? "+" : ""}${streakOffset} offset)`
        : "";

      if (isToday) {
        hoverText += `\nClaimed today: yes`;
        hoverText += `\nCome back in: ${timeDif} ${offsetString}`;
      } else if (isYesterday) {
        hoverText += `\nClaimed today: no`;
        hoverText += `\nStreak lost in: ${timeDif} ${offsetString}`;
      } else {
        hoverText += `\nStreak lost ${timeDif} ${offsetString} ago`;
        hoverText += `\nIt will be removed from your profile on the next result save`;
      }

      if (streakOffset === undefined) {
        hoverText += `\n\nIf the streak reset time doesn't line up with your timezone, you can change it in Account Settings > Account > Set streak hour offset.`;
      }
    }
    return hoverText;
  };

  const balloonPosition = (): BalloonProps["position"] =>
    bp().md ? "right" : "up";

  const genderLabel = () => {
    if (!props.profile.gender) return "";
    const labels = { male: "Erkak", female: "Ayol", other: "Boshqa" };
    return labels[props.profile.gender] ?? "";
  };

  return (
    <div class="flex w-full min-w-[200px] flex-col self-start text-sub sm:w-auto">
      <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div class="group relative">
          <div class="absolute inset-0 rounded-full bg-main opacity-20 blur-md transition-opacity group-hover:opacity-40"></div>
          <Show
            when={
              props.profile.details?.avatar !== undefined &&
              props.profile.details?.avatar !== null &&
              props.profile.details?.avatar !== "" &&
              (props.profile.avatar === undefined ||
                props.profile.avatar === null ||
                props.profile.avatar === "") &&
              (props.profile.discordAvatar === undefined ||
                props.profile.discordAvatar === null ||
                props.profile.discordAvatar === "")
            }
            fallback={
              <DiscordAvatar
                class="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full border-2 border-sub/10 object-cover shadow-sm"
                size={256}
                avatar={props.profile.avatar}
                discordAvatar={props.profile.discordAvatar}
                discordId={props.profile.discordId}
              />
            }
          >
            <div class="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border-2 border-main/20 bg-main/10 text-[5rem] sm:text-[7rem] text-main shadow-sm">
              <i class={`fas ${props.profile.details?.avatar ?? ""}`}></i>
            </div>
          </Show>
        </div>

        <div class="flex h-min w-full flex-col items-center gap-1 sm:items-start">
          <AutoShrink
            upperLimitRem={2.5}
            class="flex text-3xl leading-none font-black tracking-tight text-text"
          >
            {props.profile.name}

            <div class="mt-1 flex flex-row items-center gap-1 pl-2 text-sub opacity-80">
              <UserFlags
                {...props.profile}
                isFriend={hasConnection(props.profile.uid, "accepted")}
              />
            </div>
          </AutoShrink>

          <Show when={genderLabel() || props.profile.age}>
            <div class="mt-1 flex gap-2 text-sm font-semibold tracking-wide text-sub/70 uppercase">
              <Show when={genderLabel()}>
                <span>{genderLabel()}</span>
              </Show>
              <Show when={genderLabel() && props.profile.age}>
                <span class="my-auto h-1 w-1 rounded-full bg-sub/50"></span>
              </Show>
              <Show when={props.profile.age}>
                <span>{props.profile.age} yosh</span>
              </Show>
            </div>
          </Show>

          <div class="mt-2 flex w-full flex-col items-center gap-1 sm:items-start">
            <UserBadge
              id={props.profile.inventory?.badges.find((it) => it.selected)?.id}
              balloon={{
                position: balloonPosition(),
                length: balloonPosition() === "up" ? "medium" : undefined,
              }}
              class="w-max shadow-sm"
              hideTextOnWidth={false}
            />
            <Show
              when={props.profile.inventory?.badges.some((it) => !it.selected)}
            >
              <div class="mt-1 flex flex-row flex-wrap justify-center gap-1 opacity-70 transition-opacity hover:opacity-100 sm:justify-start">
                <For
                  each={props.profile.inventory?.badges
                    .filter((it) => !it.selected)
                    .map((it) => it.id)}
                >
                  {(badgeId) => (
                    <UserBadge
                      id={badgeId}
                      iconOnly
                      balloon={{
                        position: balloonPosition(),
                        length:
                          balloonPosition() === "up" ? "medium" : undefined,
                      }}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>

          <div class="mt-2 flex w-full flex-col flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-medium text-sub/80 sm:flex-row sm:justify-start">
            <Balloon
              inline
              text={accountAgeHint()}
              position={balloonPosition()}
            >
              A&apos;zo bo&apos;ldi:{" "}
              {formatDate(props.profile.addedAt ?? 0, "dd MMM yyyy")}
            </Balloon>
            <Show when={(props.profile.streak ?? 0) > 1}>
              <Balloon
                inline
                text={`Eng uzun streak: ${formatStreak(props.profile.maxStreak)}${extraStreakText()}`}
                position={balloonPosition()}
                break
                length="large"
              >
                Joriy streak: {formatStreak(props.profile.streak)}
              </Balloon>
            </Show>
          </div>
        </div>
      </div>

      <div class="mt-6 w-full px-2 sm:px-0">
        <LevelAndBar xp={props.profile.xp} />
      </div>
    </div>
  );
}

function BioAndKeyboard(props: {
  details?: UserProfileDetails;
  variant: Variant;
}): JSXElement {
  return (
    <div class="flex flex-col gap-6">
      <Show when={props.details?.bio}>
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Bio
          </span>
          <p class="text-base leading-relaxed text-text">
            {props.details?.bio}
          </p>
        </div>
      </Show>
      <Show when={props.details?.keyboard}>
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Keyboard
          </span>
          <p class="text-base font-medium text-text">
            {props.details?.keyboard}
          </p>
        </div>
      </Show>
    </div>
  );
}

function TypingStats(props: {
  typingStats: TypingStatsType;
  variant: Variant;
}): JSXElement {
  return (
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-2 gap-x-8 gap-y-6">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Testlar boshlandi
          </span>
          <span class="text-2xl font-black text-text">
            {props.typingStats?.startedTests ?? 0}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Testlar tugatildi
          </span>
          <span class="text-2xl font-black text-text">
            {props.typingStats?.completedTests ?? 0}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Tugatish nisbati
          </span>
          <span class="text-2xl font-black text-text">
            {formatTypingStatsRatio(props.typingStats).completedPercentage}%
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold tracking-wider text-sub uppercase">
            Vaqt
          </span>
          <span class="text-2xl font-black text-text">
            {secondsToString(props.typingStats?.timeTyping ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Socials(props: {
  socials?: UserProfileDetails["socialProfiles"];
  variant: Variant;
}): JSXElement {
  return (
    <div class="mt-4 flex shrink-0 flex-row items-center justify-center gap-4 lg:mt-0 lg:flex-col lg:items-start">
      <Show
        when={Object.values(props.socials ?? {}).some(
          (it) => it !== undefined && it.length > 0,
        )}
      >
        <div class="mb-1 hidden text-[10px] font-bold tracking-widest text-sub uppercase lg:block">
          Ijtimoiy tarmoqlar
        </div>
      </Show>
      <div class="flex gap-3 lg:flex-col">
        <Show when={props.socials?.github}>
          <a
            href={`https://github.com/${props.socials?.github}`}
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sub-alt/30"
          >
            <Fa
              icon="fa-github"
              variant="brand"
              class="text-lg text-text group-hover:text-main"
            />
            <span class="text-sm font-medium text-sub group-hover:text-text">
              {props.socials?.github}
            </span>
          </a>
        </Show>
        <Show when={props.socials?.twitter}>
          <a
            href={`https://twitter.com/${props.socials?.twitter}`}
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sub-alt/30"
          >
            <Fa
              icon="fa-twitter"
              variant="brand"
              class="text-lg text-text group-hover:text-main"
            />
            <span class="text-sm font-medium text-sub group-hover:text-text">
              {props.socials?.twitter}
            </span>
          </a>
        </Show>
        <Show when={props.socials?.website}>
          <a
            href={
              props.socials?.website?.startsWith("http")
                ? props.socials?.website
                : `https://${props.socials?.website}`
            }
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sub-alt/30"
          >
            <Fa
              icon="fa-globe"
              class="text-lg text-text group-hover:text-main"
            />
            <span class="text-sm font-medium text-sub group-hover:text-text">
              {props.socials?.website?.replace(/^https?:\/\//, "")}
            </span>
          </a>
        </Show>
      </div>
    </div>
  );
}

function LevelAndBar(props: { xp?: number }): JSXElement {
  const xpDetails = () => getXpDetails(props.xp ?? 0);
  const bar = () => {
    const details = xpDetails();
    return Math.max(
      0,
      Math.min(100, (details.levelCurrentXp / details.levelMaxXp) * 100),
    );
  };

  const formatXp = (num: number) =>
    new Intl.NumberFormat("en-US").format(Math.floor(num));

  return (
    <div class="flex w-full flex-col gap-1.5">
      <div class="mb-1 flex items-end justify-between">
        <Balloon
          class="shrink-0 text-xl leading-none font-black tracking-tight text-text"
          text={`Jami: ${formatXp(props.xp ?? 0)} xp`}
        >
          Lvl {xpDetails().level}
        </Balloon>
        <Balloon
          class="mb-[2px] shrink-0 text-[10px] leading-none font-bold tracking-wider text-sub uppercase"
          text={`Keyingi bosqichgacha: ${formatXp(
            xpDetails().levelMaxXp - xpDetails().levelCurrentXp,
          )} xp qoldi`}
        >
          {formatXp(xpDetails().levelCurrentXp)} /{" "}
          {formatXp(xpDetails().levelMaxXp)}
        </Balloon>
      </div>
      <div class="relative h-2.5 w-full overflow-hidden rounded-full bg-text/5 shadow-inner">
        <div
          class="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-main/60 to-main shadow-[0_0_10px_rgba(var(--main-color),0.4)] transition-all duration-1000 ease-out"
          style={{ width: `${bar()}%` }}
        ></div>
      </div>
    </div>
  );
}
