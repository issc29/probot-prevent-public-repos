module.exports = {
  privatizeRepo: false,
  privatizedIssueTitle: '[CRITICAL] Public Repos Disabled',
  privatizedIssueBody: 'NOTE: Public Repos are disabled for this organization! Repository was automatically converted to a Private Repo.\n\n',
  warningIssueTitle: '[CRITICAL] Public Repository Created',
  warningIssueBody: 'Please note that this repository is publicly visible to the internet!\n\n',
  ccList: '',
  excludeRepos: [],
  FILE_NAME: '.github/prevent-public-repos.yml',
  ORG_WIDE_REPO_NAME: 'org-settings'
}
