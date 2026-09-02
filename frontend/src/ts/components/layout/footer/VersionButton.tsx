import { COMPATIBILITY_CHECK } from "@typeuz/contracts";
import { JSXElement, Show, createSignal } from "solid-js";
import { envConfig } from "virtual:env-config";

import { lastSeenServerCompatibility } from "../../../ape/adapters/ts-rest-adapter";
import { getVersion } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { Fa } from "../../common/Fa";

export function VersionButton(): JSXElement {
  const [indicatorVisible, setIndicatorVisible] = createSignal(true);
  const getVersionText = (): string => getVersion().text;

  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      alert(
        JSON.stringify(
          {
            clientVersion: envConfig.clientVersion,
            clientCompatibility: COMPATIBILITY_CHECK,
            lastSeenServerCompatibility,
          },
          null,
          2,
        ),
      );
    } else {
      showModal("VersionHistory");
      setIndicatorVisible(false);
    }
  };

  const handleIndicatorClick = (e: MouseEvent): void => {
    e.stopPropagation();
    setIndicatorVisible(false);
  };

  const showNewIndicator = (): boolean =>
    getVersion().isNew && indicatorVisible();

  return (
    <button aria-label="Button" type="button" class="textButton flex" onClick={handleClick}>
      <Fa icon="fa-code-branch" fixedWidth />
      <div class="text">{getVersionText()}</div>
      <Show when={showNewIndicator()}>
        <div
          class="rounded-half bg-main px-1 text-bg"
          onClick={handleIndicatorClick}
        >
          new
        </div>
      </Show>
    </button>
  );
}
