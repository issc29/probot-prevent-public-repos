# prevent-public-repos

A GitHub Probot App that monitors and prevents Public Repositories from being created in an organization.


By default when a new repository is created with Public visibility, an Issue will be created in the repository warning that it is Public to the internet.
This App can also automatically set newly created Public Repositories to be Private.

Environment Variables:
- PRIVATIZE_REPO=[true|false]

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.
