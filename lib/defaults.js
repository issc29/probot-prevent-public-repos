module.exports = {
  monitorOnly: true,
  enablePrivateToPublic: true,
  privatizedIssueTitle: '[CRITICAL] Public Repositories are Disabled for this Org',
  privatizedIssueBody: 'NOTE: Public Repos are disabled for this organization! Repository was automatically converted to a Private Repo. Please contact an admin to override.',
  monitorIssueTitle: '[CRITICAL] Public Repositories are visible to all users',
  monitorIssueBody: 'Please note that this repository is publicly visible to all users!',
  ccList: '',
  excludeRepos: [],
  FILE_NAME: '.github/prevent-public-repos.yml',
  ORG_WIDE_REPO_NAME: 'org-settings'
}
