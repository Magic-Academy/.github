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
      const titleKeyword = 'Please invite me to the GitHub Community Organization';

      let page = 1;
      let allIssues = [];
      let hasMoreIssues = true;

      while (hasMoreIssues) {
        try {
          const response = await octokit.issues.listForRepo({
            owner,
            repo,
            state: 'open',
            per_page: 100,
            page,
          });

          if (!response || !response.data || response.data.length === 0) {
            console.log(`No more issues found on page ${page}`);
            hasMoreIssues = false;
            continue;
          }

          console.log(`Fetched ${response.data.length} issues on page ${page}`);

          // Filter issues by title keyword
          const filteredIssues = response.data.filter(issue => 
            issue.title && issue.title.includes(titleKeyword)
          );

          allIssues = allIssues.concat(filteredIssues);
          page++;

          // Check if we have reached the end of the results
          if (response.data.length < 100) {
            hasMoreIssues = false;
          }
        } catch (error) {
          console.error(`Error fetching issues on page ${page}:`, error);
          hasMoreIssues = false; // Stop processing on error
        }
      }

      console.log(`Found ${allIssues.length} issues with the title containing "${titleKeyword}"`);

      // Debugging: Print out the issue numbers for verification
      if (allIssues.length > 0) {
        console.log('Issue numbers:', allIssues.map(issue => issue.number));
      } else {
        console.log('No issues found with the specified title keyword.');
      }

      // Process each issue and send an invitation
      for (const issue of allIssues) {
        console.log(`Processing issue #${issue.number}`);
        try {
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
        } catch (error) {
          console.error(`Error processing issue #${issue.number}:`, error);
        }
      }

      console.log('All existing issues processed.');
    }

    await inviteExistingIssues();
  } catch (error) {
    console.error('Error processing existing issues:', error);
  }
})();