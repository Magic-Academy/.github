require('dotenv').config(); // Ensure dotenv is configured before any imports

(async () => {
  try {
    const { Octokit } = await import('@octokit/rest');

    // Initialize the Octokit client
    const octokit = new Octokit({
      auth: process.env.PROFILE_STATS_TOKEN,
    });

    async function inviteExistingIssues() {
      console.log('Starting to process existing issues...');
      
      const owner = 'Magic-Academy';
      const repo = '.github'; // Replace with your repository name
      const label = 'invite me to the organisation';

      // Fetch all issues with the specified label
      let page = 1;
      let allIssues = [];
      do {
        const response = await octokit.issues.listForRepo({
          owner,
          repo,
          labels: [label],
          state: 'open',
          per_page: 100,
          page,
        });
        allIssues = allIssues.concat(response.data);
        page++;
      } while (response.data.length === 100);

      console.log(`Found ${allIssues.length} issues with the label "${label}"`);

      // Process each issue and send an invitation
      for (const issue of allIssues) {
        console.log(`Processing issue #${issue.number}`);
        await octokit.request('POST /orgs/{org}/invitations', {
          org: owner,
          invitee_id: issue.user.id,
        });

        // Send a comment to notify the user and apologize for the delayed invitation
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: issue.number,
          body: `
            Dear ${issue.user.login},

            Thank you very much for your interest in joining the Magic-Academy community! We sincerely apologize for the delay in processing your request due to recent system updates.

            Your invitation to join the GitHub Organization has now been sent. Welcome to the community 🎉

            Please remember to accept the invitation and make it public so it appears on your GitHub profile for everyone else to see. You can do this by finding your name in the GitHub organization list and changing the dropdown to public:
            https://github.com/orgs/${owner}/people

            Once again, we apologize for any inconvenience caused and appreciate your patience. If you have any questions or need further assistance, feel free to reach out.

            Best regards,
            The Magic-Academy Team
          `,
        });
        console.log(`Invitation sent for issue #${issue.number}`);
      }

      console.log('All existing issues processed.');
    }

    await inviteExistingIssues();
  } catch (error) {
    console.error('Error processing existing issues:', error);
  }
})();