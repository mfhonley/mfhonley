---
title: Sold my startup for $10K and built a platform for Central Asia's schools
date: 2026-09-29
description: Five months ago I sold MindZan and became CTO of FOC World. This is what we built since — and why we are turning mental arithmetic into a game you play against other people.
---

In April I sold MindZan, my mental arithmetic platform, to FOC for $10,000 and joined as CTO of FOC World. I was 17. [Digital Business covered the deal](https://digitalbusiness.kz/2026-04-21/shkolnik-iz-pavlodara-v-15-let-uzhe-zarabatival-500-tisyach-tenge-a-v-17-uspeshno-prodal-startap/) back then. This is what happened next.

Some context: FOC has been running mental arithmetic tournaments since 2015. It started in Aktobe and held its first republican tournament a year later. What it didn't have was its own technology. That became my job.

## From zero

- **April** — work on the new platform starts from an empty repository
- **May** — the first schools move their students onto it
- **June** — our first big event runs entirely on our own system
- **July** — the platform goes international, goes online and takes payments right inside the app
- **September** — our most active month so far

## Five months in numbers

- **46 schools** in 26 cities across different countries
- **200,000+ training sessions**
- **3.4 million solved problems**
- **~240,000 lines of code** across nine codebases

## What we built

The biggest thing: we automated how olympiads are run. Registration, payment, seating, scoring, protocols and certificates — the whole cycle now lives in one system instead of spreadsheets and chats.

And we came up with a new format. Every child competes on their own tablet, connected over the local network to an app that runs the hall — and keeps working even when the venue's internet doesn't. As far as we know, no one in the world had run mental arithmetic competitions this way before.

Around that, FOC World is:

- a training app for students: Flash Anzan, practice, audio dictation, streaks, a leaderboard with countries and real-time 1v1 battles;
- tools for teachers: groups, homework, worksheets and a live view of who is training right now;
- a portal for schools and the federation: rosters, licences, registration with payment, results, and certificates anyone can verify online;
- services that generate problems, build protocols and render certificates.

122 database migrations in five months — roughly one every working day. The interface speaks Russian, Kazakh and English.

## Towards chess.com

Mental arithmetic has always been something you do alone — you against a sheet of problems and a timer. We want it to feel like a game you play against other people.

So we borrowed from games. Students play 1v1 battles in real time: the same problems, at the same moment, and the better result wins. Every match moves your rating. For the rating we took Elo — the system chess and chess.com run on. For motivation we took ranks, the way Dota 2 has them: your number turns into a rank you can see and chase, from Bronze through Silver, Gold, Diamond and Master to Grandmaster. Win streaks, peak rating and a leaderboard with countries do the rest.

It is a small step, but it changes why a kid opens the app. Not because homework is due — because someone just beat them.

## What I learned

**Distribution was the right trade.** On my own, MindZan had two schools after three weeks. Inside FOC it grew to 46 in five months, because FOC already had the trust of the people who run those schools. Selling didn't mean giving the product away — it meant giving it reach.

**Real events are the best test.** A competition has a fixed date and an audience watching every screen. You can't ship "almost working" to that. That's why the hall app works offline.

## What's next

The world championship this autumn is the next big test for the tablet format.

After that comes the season. We are building a year-long race: regular online qualifiers and live competitions feed one shared rating, and the best players in each category meet in a December final for the title of FOC Champion of the Year. One player, one profile, one rating — whether you compete from home or in a hall.

Then: letting students train without a school, and taking all of this beyond Central Asia.

Chess has chess.com. Mental arithmetic is next.

## In the press

- [Digital Business, September 2026](https://digitalbusiness.kz/2026-09-29/prodal-startap-za-10-tisyach-v-17-let-teper-platformoy-pavlodartsa-polzuyutsya-shkolniki-po-vsemu-miru/) — about this article and the platform (in Russian)
- [Digital Business, April 2026](https://digitalbusiness.kz/2026-04-21/shkolnik-iz-pavlodara-v-15-let-uzhe-zarabatival-500-tisyach-tenge-a-v-17-uspeshno-prodal-startap/) — interview about MindZan and the deal (in Russian)
- [FOC World](https://focworld.com) — the federation and the platform
