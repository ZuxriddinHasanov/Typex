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
import { setUserToReport } from "../../../states/user-report";

import { secondsToString } from "../../../utils/date-and-time";
import { getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { AutoShrink } from "../../common/AutoShrink";
import { Balloon, BalloonProps } from "../../common/Balloon";
// import { Bar } from "../../common/Bar";

import { DiscordAvatar } from "../../common/DiscordAvatar";
import { UserBadge } from "../../common/UserBadge";
import { UserFlags } from "../../common/UserFlags";
import { EditProfile } from "../../modals/EditProfileModal";
import { Fa } from "../../common/Fa";

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
    <div class="relative w-full rounded-[2rem] bg-gradient-to-br from-bg/60 to-sub-alt/30 border border-main/10 shadow-xl overflow-hidden backdrop-blur-xl">
      <div class="absolute inset-0 bg-gradient-to-r from-main/5 via-transparent to-main/5 pointer-events-none"></div>
      <div class="relative z-10 flex flex-col p-8 sm:p-10 gap-8">
        
        {/* Top Section: Avatar, Name, and Badges */}
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-8">
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
        <div class="h-px w-full bg-gradient-to-r from-transparent via-sub/20 to-transparent"></div>

        {/* Bottom Section: Stats, Bio, Socials */}
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div class="md:col-span-5 flex flex-col gap-6">
            <Show when={variant() === "full" || variant() === "hasBioOrKeyboard"}>
              <BioAndKeyboard details={props.profile.details} variant={variant()} />
            </Show>
            <Show when={variant() === "full" || variant() === "hasSocials"}>
              <Socials
                socials={props.profile.details?.socialProfiles}
                variant={variant()}
              />
            </Show>
          </div>

          <div class="hidden md:block md:col-span-1 place-self-center">
            <div class="w-px h-24 bg-sub/10"></div>
          </div>

          <div class="md:col-span-6 flex justify-end">
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

  const showFriendsButton = () =>
    isAuthenticated() && !isUsersProfile() && !hasConnection(props.profile.uid);

  const handleAddFriend = () => {
    void addConnection({
      receiverName: props.profile.name,
      receiverUid: props.profile.uid,
    });
  };

  return (
    <>
      <Show
        when={props.isAccountPage === true}
        fallback={
          <>
            <Show when={!isUsersProfile()}>
              <button type="button"
                class="group flex items-center gap-2 rounded-xl bg-sub-alt/50 px-4 py-2 text-sm font-semibold text-sub transition-all hover:bg-main hover:text-bg shadow-sm"
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
                <span>Shikoyat qilish</span>
              </button>
            </Show>
            <Show when={showFriendsButton()}>
              <button type="button"
                class="group flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-500 transition-all hover:bg-green-500 hover:text-bg shadow-sm"
                onClick={handleAddFriend}
              >
                <Fa icon="fa-user-plus" class="text-xs" />
                <span>Do&apos;st qo&apos;shish</span>
              </button>
            </Show>
          </>
        }
      >
        <button type="button"
          onClick={() => {
            if (props.profile.banned === true) {
              showNoticeNotification("Ban qilingan foydalanuvchilar profilni tahrirlay olmaydi");
              return;
            }
            showModal("EditProfile");
          }}
          class="group flex items-center gap-2 rounded-xl bg-main/10 px-6 py-2.5 text-sm font-bold text-main transition-all hover:bg-main hover:text-bg hover:shadow-lg hover:shadow-main/20"
        >
          <Fa icon="fa-cog" class="transition-transform group-hover:rotate-90" />
          <span>Sozlamalar & Tahrirlash</span>
        </button>
        <button type="button"
          onClick={() => showNoticeNotification("Sertifikatlar tez orada qo'shiladi!")}
          class="group flex items-center gap-2 rounded-xl border border-main/20 bg-bg/50 px-6 py-2.5 text-sm font-bold text-text transition-all hover:border-main/50 hover:bg-main/5"
        >
          <Fa icon="fa-certificate" class="text-main" />
          <span>Sertifikatlar</span>
        </button>
      </Show>

      <button type="button"
        class="group flex items-center gap-2 rounded-xl bg-sub-alt/50 px-4 py-2.5 text-sm font-semibold text-sub transition-all hover:bg-main hover:text-bg shadow-sm"
        onClick={() => {
          const url = `${location.origin}/profile/${props.profile.name}`;
          navigator.clipboard.writeText(url).then(
            function () {
              showNoticeNotification("Havola nusxalandi");
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
    <div class="flex flex-col w-full sm:w-auto self-start text-sub min-w-[200px]">
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div class="relative group">
          <div class="absolute inset-0 bg-main rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <Show
            when={props.profile.avatar}
            fallback={
              <DiscordAvatar
                class="relative h-20 w-20 rounded-full border-2 border-sub/10 object-cover shadow-sm"
                size={256}
                discordAvatar={props.profile.discordAvatar}
                discordId={props.profile.discordId}
              />
            }
          >
            <div class="relative flex h-20 w-20 items-center justify-center rounded-full bg-main/10 border-2 border-main/20 text-4xl text-main shadow-sm">
              <i class={`fas ${props.profile.avatar}`}></i>
            </div>
          </Show>
        </div>

        <div class="flex h-min flex-col gap-1 items-center sm:items-start w-full">
          <AutoShrink upperLimitRem={2.5} class="flex text-text font-black tracking-tight leading-none text-3xl">
            {props.profile.name}

            <div class="flex flex-row items-center gap-1 pl-2 text-sub opacity-80 mt-1">
              <UserFlags
                {...props.profile}
                isFriend={hasConnection(props.profile.uid, "accepted")}
              />
            </div>
          </AutoShrink>
          
          <Show when={genderLabel() || props.profile.age}>
            <div class="flex gap-2 text-sm font-semibold tracking-wide uppercase text-sub/70 mt-1">
              <Show when={genderLabel()}>
                <span>{genderLabel()}</span>
              </Show>
              <Show when={genderLabel() && props.profile.age}>
                <span class="w-1 h-1 bg-sub/50 rounded-full my-auto"></span>
              </Show>
              <Show when={props.profile.age}>
                <span>{props.profile.age} yosh</span>
              </Show>
            </div>
          </Show>
          
          <div class="flex flex-col items-center sm:items-start gap-1 mt-2 w-full">
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
              <div class="flex flex-row flex-wrap gap-1 mt-1 justify-center sm:justify-start opacity-70 hover:opacity-100 transition-opacity">
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
                        length: balloonPosition() === "up" ? "medium" : undefined,
                      }}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
          
          <div class="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-medium text-sub/80 w-full justify-center sm:justify-start">
            <Balloon inline text={accountAgeHint()} position={balloonPosition()}>
              A&apos;zo bo&apos;ldi: {formatDate(props.profile.addedAt ?? 0, "dd MMM yyyy")}
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
    <div class="flex flex-col gap-4 max-w-[250px] w-full mt-4 lg:mt-0">
      <Show
        when={
          props.details?.bio !== undefined && props.details.bio.length > 0
        }
      >
        <div class="flex flex-col gap-1">
          <div class="text-[10px] font-bold tracking-widest text-sub uppercase">Bio</div>
          <div class="text-sm text-text leading-snug whitespace-pre-line">{props.details?.bio}</div>
        </div>
      </Show>
      <Show
        when={
          props.details?.keyboard !== undefined &&
          props.details.keyboard.length > 0
        }
      >
        <div class="flex flex-col gap-1">
          <div class="text-[10px] font-bold tracking-widest text-sub uppercase">Klaviatura</div>
          <div class="text-sm text-text leading-snug whitespace-pre-line bg-sub-alt/50 p-2 rounded-lg border border-sub/10 inline-block w-max font-mono shadow-sm">{props.details?.keyboard}</div>
        </div>
      </Show>
    </div>
  );
}

function TypingStats(props: {
  typingStats: TypingStatsType;
  variant: Variant;
}): JSXElement {
  const stats = () => formatTypingStatsRatio(props.typingStats);

  return (
    <div class="flex flex-col gap-5 mt-4 lg:mt-0 lg:ml-4 flex-1">
      <div class="flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-main shrink-0">
          <Fa icon="fa-play" />
        </div>
        <div class="flex flex-col">
          <div class="text-[10px] font-bold tracking-widest text-sub uppercase">Boshlangan testlar</div>
          <div class="text-2xl font-black text-text leading-none mt-1">
            {props.typingStats.startedTests}
          </div>
        </div>
      </div>
      
      <Balloon
        class="flex items-center gap-4"
        text={
          stats().completedPercentage !== ""
            ? `${stats().completedPercentage}% (har yakunlangan testga ${stats().restartRatio} qayta boshlash)`
            : undefined
        }
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 shrink-0">
          <Fa icon="fa-check" />
        </div>
        <div class="flex flex-col text-left">
          <div class="text-[10px] font-bold tracking-widest text-sub uppercase">Yakunlangan testlar</div>
          <div class="text-2xl font-black text-text leading-none mt-1">
            {props.typingStats.completedTests}
          </div>
        </div>
      </Balloon>
      
      <div class="flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
          <Fa icon="fa-clock" />
        </div>
        <div class="flex flex-col">
          <div class="text-[10px] font-bold tracking-widest text-sub uppercase">Yozishga ketgan vaqt</div>
          <div class="text-2xl font-black text-text leading-none mt-1">
            {secondsToString(
              Math.round(props.typingStats.timeTyping ?? 0),
              true,
              true,
            )}
          </div>
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
    <div class="flex flex-row lg:flex-col items-center lg:items-start justify-center gap-4 mt-4 lg:mt-0 shrink-0">
      <Show
        when={Object.values(props.socials ?? {}).some(
          (it) => it !== undefined && it.length > 0,
        )}
      >
        <div class="text-[10px] font-bold tracking-widest text-sub uppercase mb-1 hidden lg:block">
          Ijtimoiy tarmoqlar
        </div>
      </Show>
      <div class="flex lg:flex-col gap-3">
        <Show when={props.socials?.github}>
          <a
            href={`https://github.com/${props.socials?.github}`}
            target="_blank"
            rel="noreferrer"
            class="flex items-center justify-center h-12 w-12 rounded-xl bg-sub-alt/50 border border-sub/10 text-sub hover:text-[#333] hover:bg-white hover:scale-105 transition-all shadow-sm"
            title={props.socials?.github}
          >
            <Fa icon="fa-github" variant="brand" class="text-xl" />
          </a>
        </Show>
        <Show when={props.socials?.twitter}>
          <a
            href={`https://x.com/${props.socials?.twitter}`}
            target="_blank"
            rel="noreferrer"
            class="flex items-center justify-center h-12 w-12 rounded-xl bg-sub-alt/50 border border-sub/10 text-sub hover:text-white hover:bg-[#1DA1F2] hover:scale-105 transition-all shadow-sm"
            title={props.socials?.twitter}
          >
            <Fa icon="fa-twitter" variant="brand" class="text-xl" />
          </a>
        </Show>
        <Show when={props.socials?.website}>
          <a
            href={props.socials?.website ?? ""}
            target="_blank"
            rel="noreferrer"
            class="flex items-center justify-center h-12 w-12 rounded-xl bg-sub-alt/50 border border-sub/10 text-sub hover:text-white hover:bg-main hover:scale-105 transition-all shadow-sm"
            title={props.socials?.website}
          >
            <Fa icon="fa-globe" class="text-xl" />
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
    return Math.max(0, Math.min(100, (details.levelCurrentXp / details.levelMaxXp) * 100));
  };
  
  const formatXp = (num: number) => new Intl.NumberFormat("en-US").format(Math.floor(num));

  return (
    <div class="flex w-full flex-col gap-1.5">
      <div class="flex justify-between items-end mb-1">
        <Balloon
          class="shrink-0 text-text font-black text-xl tracking-tight leading-none"
          text={`Jami: ${formatXp(props.xp ?? 0)} xp`}
        >
          Lvl {xpDetails().level}
        </Balloon>
        <Balloon
          class="shrink-0 text-[10px] font-bold text-sub uppercase tracking-wider leading-none mb-[2px]"
          text={`Keyingi bosqichgacha: ${formatXp(
            xpDetails().levelMaxXp - xpDetails().levelCurrentXp,
          )} xp qoldi`}
        >
          {formatXp(xpDetails().levelCurrentXp)} / {formatXp(xpDetails().levelMaxXp)}
        </Balloon>
      </div>
      <div class="relative w-full h-2.5 bg-text/5 rounded-full overflow-hidden shadow-inner">
        <div 
          class="absolute top-0 left-0 h-full bg-gradient-to-r from-main/60 to-main rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--main-color),0.4)]"
          style={{ width: `${bar()}%` }}
        ></div>
      </div>
    </div>
  );
}
