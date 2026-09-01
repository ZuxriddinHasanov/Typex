import { Config } from "@typeuz/schemas/configs";
import { isAuthenticated } from "../states/core";
import { showErrorNotification } from "../states/notifications";
import Ape from ".";

export async function saveConfig(config: Partial<Config>): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.save({ body: config });
    if (response.status !== 200) {
      showErrorNotification("Konfiguratsiyani saqlab bo'lmadi", { response });
    }
  }
}
export async function deleteConfig(): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.delete();
    if (response.status !== 200) {
      showErrorNotification("Konfiguratsiyani tiklab bo'lmadi", { response });
    }
  }
}
