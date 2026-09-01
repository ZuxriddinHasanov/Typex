import { Config } from "../../config/store";
import QuotesController, { Quote } from "../../controllers/quotes-controller";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { isAuthenticated } from "../../states/core";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { Command } from "../types";
import { getCurrentQuote } from "../../states/test";

const commands: Command[] = [
  {
    id: "addQuoteToFavorite",
    display: "Add current quote to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        !QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        showLoaderBar();
        await QuotesController.setQuoteFavorite(
          getCurrentQuote() as Quote,
          true,
        );
        hideLoaderBar();
        showSuccessNotification("Iqtibos saralanganlarga qo'shildi");
      } catch (e) {
        hideLoaderBar();
        showErrorNotification("Iqtibosni saralanganlarga qo'shib bo'lmadi", { error: e });
      }
    },
  },
  {
    id: "removeQuoteFromFavorite",
    display: "Remove current quote from favorite",
    icon: "fa-heart-broken",
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        showLoaderBar();
        await QuotesController.setQuoteFavorite(
          getCurrentQuote() as Quote,
          false,
        );
        hideLoaderBar();
        showSuccessNotification("Iqtibos saralanganlardan olib tashlandi");
      } catch (e) {
        hideLoaderBar();
        showErrorNotification("Iqtibosni saralanganlardan olib tashlab bo'lmadi", {
          error: e,
        });
      }
    },
  },
];

export default commands;
