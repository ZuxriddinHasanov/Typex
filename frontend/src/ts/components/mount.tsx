import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../queries";
import { qsa } from "../utils/dom";
import { TypeUZAdSlot } from "./common/TypeUZAdSlot";
import { Theme } from "./core/Theme";
import { CommandlineHotkey } from "./hotkeys/CommandlineHotkey";
import { Footer } from "./layout/footer/Footer";
import { Header } from "./layout/header/Header";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { NotFoundPage } from "./pages/404Page";
import { AboutPage } from "./pages/AboutPage";
import { AccountPage } from "./pages/account/AccountPage";
import { MyProfile } from "./pages/account/MyProfile";
import { AdminAdsPage } from "./pages/admin/AdminAdsPage";
import { AdminAIPage } from "./pages/admin/AdminAIPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { LandingPage } from "./pages/landing/LandingPage";
import { LeaderboardPage } from "./pages/leaderboard/LeaderboardPage";
import { PrivacyPolicyPage } from "./pages/legal/PrivacyPolicyPage";
import { SecurityPolicyPage } from "./pages/legal/SecurityPolicyPage";
import { TermsOfServicePage } from "./pages/legal/TermsOfServicePage";
import { AdminLoginPage } from "./pages/login/AdminLoginPage";
import { LoginPage } from "./pages/login/LoginPage";
import { OnboardingPage } from "./pages/onboarding/OnboardingPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { Keymap } from "./pages/test/Keymap";
import { LiveStatsBar } from "./pages/test/LiveStatsBar";
import { TestModesNotice } from "./pages/test/modes-notice/TestModesNotice";
import { Monkey } from "./pages/test/Monkey";
import { TestConfig } from "./pages/test/TestConfig";
import { Popups } from "./popups/Popups";

const components: Record<string, () => JSXElement> = {
  admindashboardpage: () => <AdminDashboardPage />,
  adminuserspage: () => <AdminUsersPage />,
  adminuserdetailpage: () => {
    // We can get uid from page params
    // But Solid doesn't easily expose the router params to top-level mount here unless we pass it.
    // Let's use a small wrapper or just get it from URL/history state if needed.
    // Actually, we registered it in page-controller with `params` object on the page options.
    // The Page component itself can read `PageController.options.params.uid`.
    const getUid = () => {
      // Very hacky but works for now to extract from URL if not using a real router hook
      const match = location.pathname.match(/\/typeuz-hq\/users\/([^/]+)/);
      return match ? match[1] : "";
    };
    return <AdminUserDetailPage uid={getUid()} />;
  },
  admincontentpage: () => <AdminContentPage />,
  adminanalyticspage: () => <AdminAnalyticsPage />,
  adminalipage: () => <AdminAIPage />,
  adminnotificationspage: () => <AdminNotificationsPage />,
  adminadspage: () => <AdminAdsPage />,
  adminsettingspage: () => <AdminSettingsPage />,
  adminloginpage: () => <AdminLoginPage />,
  landingpage: () => <LandingPage />,
  footer: () => <Footer />,
  aboutpage: () => <AboutPage />,
  accountpage: () => <AccountPage />,
  loginpage: () => <LoginPage />,
  leaderboardpage: () => <LeaderboardPage />,
  profilepage: () => <ProfilePage />,
  myprofile: () => <MyProfile />,
  modals: () => <Modals />,
  popups: () => <Popups />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
  header: () => <Header />,
  testconfig: () => <TestConfig />,
  livestatsbar: () => <LiveStatsBar />,
  commandlinehotkey: () => <CommandlineHotkey />,
  testmodesnotice: () => <TestModesNotice />,
  notfoundpage: () => <NotFoundPage />,
  keymap: () => <Keymap />,
  monkey: () => <Monkey />,
  onboardingpage: () => <OnboardingPage />,
  privacypolicypage: () => <PrivacyPolicyPage />,
  termsofservicepage: () => <TermsOfServicePage />,
  securitypolicypage: () => <SecurityPolicyPage />,
  "ad-result": () => <TypeUZAdSlot slotId="ad-result" class="mt-4" />,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(
      () => (
        <QueryClientProvider client={queryClient}>
          {component()}
        </QueryClientProvider>
      ),
      mountPoint.native,
    );
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    try {
      mountToMountpoint(`mount[data-component=${query}]`, component);
    } catch (e) {
      console.error(`Failed to mount ${query}`, e);
    }
  }
}
