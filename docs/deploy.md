# Deploying

If you would like to run your own instance of this app, see the [docs for deployment](https://probot.github.io/docs/deployment/).

This app requires these **Permissions & events** for the GitHub App:

- Repository administration - **Read & Write**
  - [x] Check the box for Repository events
  - [x] Check the box for Public events
- Single File - **Read-only**
  - [x] Path: `.github/prevent-public-repos.yml`
