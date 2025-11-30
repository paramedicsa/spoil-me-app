# Spoil Me Vintage — Firebase Hosting Deployment

This repository contains the web app and Android Capacitor project.

This README covers how to push this project to GitHub and set up a GitHub Actions workflow that builds the web app, copies the APK into `dist/`, and deploys to Firebase Hosting.

## Prerequisites
- A GitHub repository (create one and note the name)
- Firebase project and Firebase Hosting enabled
- A Firebase CI token: `FIREBASE_TOKEN` (create with `firebase login:ci` locally)

## Files added for CI
- `.github/workflows/firebase-deploy.yml` — GitHub Actions workflow (builds, copies APK, deploys)

## How to use
1. Create a GitHub repo and push this project (see commands below).
2. In GitHub repo, add secret `FIREBASE_TOKEN` (value from your `firebase login:ci`).
3. Optional: Add `ANDROID_KEYSTORE` secrets if you want to build signed APKs in CI.

## Push commands
```bash
git init
git add .
git commit -m "Initial commit: app + CI"
# create repo on GitHub and push
git remote add origin git@github.com:<your-username>/<repo>.git
git branch -M main
git push -u origin main
```

## Notes
- The CI workflow uses Node & Android setup steps; building a signed release APK in CI requires storing keystore secrets.
- For simple hosting-only deployments, the workflow deploys the `dist/` folder to Firebase Hosting: it also copies the debug APK to `dist/` so it is served.

