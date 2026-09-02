import { Accessor, JSXElement, Show } from "solid-js";

import {
  ResultsQueryState,
  ResultStats,
  useResultStatsLiveQuery,
} from "../../../collections/results";
import { getFormatting } from "../../../states/core";
import { secondsToString } from "../../../utils/date-and-time";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";

export function TestStats(props: {
  queryState: Accessor<ResultsQueryState | undefined>;
}): JSXElement {
  const format = getFormatting;
  const formatWpm = (val: number): string => format().typingSpeed(val);
  const formatPercentage = (val: number): string => format().percentage(val);

  const statsQuery = useResultStatsLiveQuery(() => props.queryState());
  const last10StatsQuery = useResultStatsLiveQuery(() => props.queryState(), {
    lastTen: true,
  });

  const stats = () => statsQuery()[0];
  const last10 = () => last10StatsQuery()[0];

  return (
    <AsyncContent collections={{ statsQuery, last10StatsQuery }}>
      {() => (
        <Show
          when={
            stats() !== undefined &&
            last10() !== undefined &&
            ([stats() as ResultStats, last10() as ResultStats] as const)
          }
        >
          {(data) => {
            const [stats, last10] = data();

            return (
              <>
                <div class="flex items-center justify-center text-sub">
                  taxminiy yozilgan so'zlar{" "}
                  <span class="p-5 text-5xl text-text lg:text-5xl">
                    {stats.words}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <Stat
                    header="testlar boshlangan"
                    value={stats.restarted + stats.completed}
                  />
                  <div>
                    <div class="text-sub">
                      testlar tugallangan{" "}
                      <span
                        data-balloon-length="xlarge"
                        data-balloon-pos="up"
                        aria-label="Ma'lumotlar bazasida natijalar soni ko'payganligi sababli, endi faqat oxirgi 1000 ta natijangizni batafsil ko'rishingiz mumkin. Yozishga sarflangan umumiy vaqt, boshlangan va tugallangan testlar statistikasi filtrlarning yuqorisida, sahifaning tepasida doimiy yangilanib turadi."
                        role="alertdialog"
                      >
                        <Fa icon="fa-question-circle" />
                      </span>
                    </div>
                    <div class="text-2xl leading-[1.1] md:text-3xl lg:text-5xl">
                      {stats.completed}(
                      {stats.completed + stats.restarted > 0
                        ? Math.floor(
                            (stats.completed /
                              (stats.completed + stats.restarted)) *
                              100,
                          )
                        : 0}
                      %)
                    </div>
                    <div class="text-xs">
                      {stats.completed > 0
                        ? (stats.restarted / stats.completed).toFixed(1)
                        : "0.0"}{" "}
                      restarts per completed test
                    </div>
                  </div>

                  <Stat
                    header="yozishga sarflangan vaqt"
                    value={stats.timeTyping}
                    formatter={(val) =>
                      secondsToString(Math.round(val), true, true)
                    }
                  />

                  <Stat
                    header={`eng yuqori ${format().typingSpeedUnit}`}
                    value={stats.maxWpm}
                    formatter={formatWpm}
                  />
                  <Stat
                    header={`o'rtacha ${format().typingSpeedUnit}`}
                    value={stats.avgWpm}
                    formatter={formatWpm}
                  />
                  <Stat
                    header={`o'rtacha ${format().typingSpeedUnit} (so'nggi 10 ta test)`}
                    value={last10.avgWpm}
                    formatter={formatWpm}
                  />

                  <Stat
                    header={`eng yuqori raw ${format().typingSpeedUnit}`}
                    value={stats.maxRaw}
                    formatter={formatWpm}
                  />
                  <Stat
                    header={`o'rtacha sof tezlik (raw) ${format().typingSpeedUnit}`}
                    value={stats.avgRaw}
                    formatter={formatWpm}
                  />
                  <Stat
                    header={`o'rtacha sof tezlik (raw) ${format().typingSpeedUnit} (so'nggi 10 ta test)`}
                    value={last10.avgRaw}
                    formatter={formatWpm}
                  />

                  <Stat
                    header={`eng yuqori acc`}
                    value={stats.maxAcc}
                    formatter={formatPercentage}
                  />
                  <Stat
                    header={`o'rtacha aniqlik (acc)`}
                    value={stats.avgAcc}
                    formatter={formatPercentage}
                  />
                  <Stat
                    header={`o'rtacha aniqlik (acc) (so'nggi 10 ta test)`}
                    value={last10.avgAcc}
                    formatter={formatPercentage}
                  />

                  <Stat
                    header={`eng yuqori consistency`}
                    value={stats.maxConsistency}
                    formatter={formatPercentage}
                  />
                  <Stat
                    header={`o'rtacha barqarorlik`}
                    value={stats.avgConsistency}
                    formatter={formatPercentage}
                  />
                  <Stat
                    header={`o'rtacha barqarorlik (so'nggi 10 ta test)`}
                    value={last10.avgConsistency}
                    formatter={formatPercentage}
                  />
                </div>
              </>
            );
          }}
        </Show>
      )}
    </AsyncContent>
  );
}

function Stat(options: {
  header: string;
  value: number | undefined;
  formatter?: (value: number) => string;
}): JSXElement {
  return (
    <div>
      <div class="text-sub">{options.header}</div>

      <div class="text-2xl leading-[1.1] md:text-3xl lg:text-5xl">
        <Show when={options.value !== undefined}>
          {options.formatter !== undefined
            ? options.formatter(options.value ?? -1)
            : options.value}
        </Show>
      </div>
    </div>
  );
}
