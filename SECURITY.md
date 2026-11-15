# Security policy

## Reporting a vulnerability

Please report it privately, not in a public issue: open the **Security** tab of this repo and choose **Report a vulnerability**. This is a one-person project, so replies are best effort, but every report is read.

## What's covered

The latest `main` only. Apps deploy from `main`, and there are no older releases to patch.

In scope: the code in this repo, the Firestore security rules, Cloud Functions, and the CI setup. Out of scope: anything in a third-party service (Firebase, GitHub, Discord) itself.

## Not a vulnerability

Link-only apps (such as delta-green) are unlisted, not secret: anyone with a game's link can read and write that game. That is how they are designed. Rules that let someone read or write a game _without_ its ID, or reach another game, are a vulnerability.
