#!/bin/bash
sed -i 's/disabled={page() === 0}/disabled={page() === 0 || lbQuery.isFetching}/g' frontend/src/ts/components/pages/leaderboard/LeaderboardPage.tsx
sed -i 's/onClick={() => goToPage(1)}/onClick={() => goToPage(1)}\n            disabled={entries().length < 50 || lbQuery.isFetching}/g' frontend/src/ts/components/pages/leaderboard/LeaderboardPage.tsx
