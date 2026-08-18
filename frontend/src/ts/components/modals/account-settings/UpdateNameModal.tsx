import { UserNameSchema } from "@typeuz/schemas/users";
import { z } from "zod";

import Ape from "../../../ape";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../auth";
import { setSnapshot, getSnapshot } from "../../../db";
import { isAuthenticated } from "../../../states/core";
import { showSimpleModal } from "../../../states/simple-modal";
import { remoteValidation } from "../../../utils/remote-validation";

export function showUpdateNameModal(): void {
  const snapshot = getSnapshot();
  if (!isAuthenticated() || !snapshot) return;

  showSimpleModal({
    title: "Update name",
    buttonText: "O'zgartirish",
    text: snapshot.needsToChangeName
      ? "Siz akkaunt nomingizni o'zgartirishingiz kerak. Bunga sabab: bunday ism avval olingan, ism ko'rsatilmagan yoki yaroqsiz bo'lishi mumkin (masalan, bo'sh joy qoldirilgan). Noqulaylik uchun uzr."
      : undefined,
    schema: z.object({
      newName: UserNameSchema,
    }),
    inputs: {
      newName: {
        placeholder: "Yangi ism",
        type: "text",
        validation: {
          isValid: remoteValidation(
            async (name: string) =>
              Ape.users.getNameAvailability({ params: { name } }),
            { check: (data) => data.available || "Bu ism band" },
          ),
          debounceDelay: 1000,
        },
      },
    },

    execFn: async ({ newName }) => {
      const response = await Ape.users.updateName({
        body: { name: newName },
      });
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to update name",
          notificationOptions: { response },
        };
      }

      snapshot.name = newName;

      setSnapshot(snapshot);

      return {
        status: "success",
        message: "Name updated",
      };
    },
  });
}
