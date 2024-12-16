require('dotenv').config(); // Ensure dotenv is configured before any imports

// Dynamically import Octokit to support ES modules
(async () => {
  const { Octokit } = await import('@octokit/rest');

  // Initialize the Octokit client outside of async function for potential reuse
  const octokit = new Octokit({
    auth: process.env.PROFILE_STATS_TOKEN,
  });

  const owner = 'Magic-Academy'; // Organization name 组织名称
  const repo = '.github'; // Replace with your repository name 替换为您的仓库名称
  const titleKeyword = 'Please invite me to the GitHub Community Organization'; // Keyword in issue title 问题标题中的关键词

  // Check if a user is already a member of the organization
  // 检查用户是否已经是组织成员
  async function checkIfUserIsMember(username) {
    try {
      await octokit.orgs.checkMembershipForUser({
        org: owner,
        username,
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error; // Re-throw other errors 重新抛出其他错误
    }
  }

  // Check if a user has a pending invitation from the organization
  // 检查用户是否有来自组织的待处理邀请
  async function hasPendingInvitation(userId) {
    try {
      const response = await octokit.request('GET /orgs/{org}/invitations', {
        org: owner,
      });

      if (!response || !response.data) {
        return false;
      }

      // Return true if there's a pending invitation for the user
      // 如果用户有未处理的邀请，则返回 true
      return response.data.some(invitation => invitation.invitee.id === userId);
    } catch (error) {
      console.error('Error checking for pending invitations:', error); // 错误检查待处理邀请
      return false;
    }
  }

  // Send an invitation and close the issue after processing
  // 发送邀请并在处理后关闭问题
  async function sendInvitationAndCloseIssue(issue) {
    console.log(`Processing issue #${issue.number}`); // 正在处理的问题编号

    // Check if the user is already a member or has a pending invitation
    // 检查用户是否已经是成员或有未处理的邀请
    const isMember = await checkIfUserIsMember(issue.user.login);
    const hasPendingInvite = await hasPendingInvitation(issue.user.id);

    if (isMember || hasPendingInvite) {
      console.log(`User ${issue.user.login} is either already a member or has a pending invitation.`);
      
      // Close the issue if it's already been processed
      // 如果问题已经被处理过，则关闭它
      await closeIssue(issue.number, 'The invitation has already been sent.');
      return;
    }

    try {
      // Send an invitation to join the organization
      // 发送加入组织的邀请
      await octokit.request('POST /orgs/{org}/invitations', {
        org: owner,
        invitee_id: issue.user.id,
      });

      // Send a comment to notify the user and apologize for the delayed invitation
      // 发送评论以通知用户并就延迟发送邀请道歉
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

      // Close the issue after sending the invitation
      // 发送邀请后关闭问题
      await closeIssue(issue.number, 'Invitation sent successfully.');

    } catch (error) {
      console.error(`Error processing issue #${issue.number}:`, error);
    }
  }

  // Close an issue with a message
  // 使用消息关闭问题
  async function closeIssue(issueNumber, message) {
    try {
      await octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: 'closed',
        state_reason: 'completed', // Reason for closing the issue 关闭问题的原因
        labels: ['invitation-processed'], // Optionally add a label to indicate the issue was processed 可选添加标签表示问题已处理
        body: `${message}\n\n---\nThis issue has been automatically closed.`,
      });
      console.log(`Issue #${issueNumber} closed.`);
    } catch (error) {
      console.error(`Error closing issue #${issueNumber}:`, error);
    }
  }

  // Process existing open issues that match the title keyword
  // 处理与标题关键词匹配的现有开放问题
  async function inviteExistingIssues() {
    console.log('Starting to process existing issues...'); // 开始处理现有问题

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

        // Filter issues by title keyword and exclude those with 'invitation-processed' label
        // 根据标题关键词过滤问题，并排除那些带有 'invitation-processed' 标签的问题
        const filteredIssues = response.data.filter(issue => 
          issue.title && issue.title.includes(titleKeyword) &&
          !issue.labels.some(label => label.name === 'invitation-processed')
        );

        allIssues = allIssues.concat(filteredIssues);
        page++;

        // Check if we have reached the end of the results
        // 检查是否已经到达结果的末尾
        if (response.data.length < 100) {
          hasMoreIssues = false;
        }
      } catch (error) {
        console.error(`Error fetching issues on page ${page}:`, error);
        hasMoreIssues = false; // Stop processing on error 错误时停止处理
      }
    }

    console.log(`Found ${allIssues.length} issues with the title containing "${titleKeyword}"`);

    // Debugging: Print out the issue numbers for verification
    // 调试：打印问题编号进行验证
    if (allIssues.length > 0) {
      console.log('Issue numbers:', allIssues.map(issue => issue.number));
    } else {
      console.log('No issues found with the specified title keyword.');
    }

    // Process each issue and send an invitation
    // 处理每个问题并发送邀请
    for (const issue of allIssues) {
      await sendInvitationAndCloseIssue(issue);
    }

    console.log('All existing issues processed.');
  }

  // Export functions for use in GitHub Actions
  // 导出函数以供 GitHub Actions 使用
  module.exports = {
    inviteExistingIssues,
    sendInvitationAndCloseIssue,
  };

  // Call inviteExistingIssues when running script directly (for scheduled tasks)
  // 直接运行脚本时调用 inviteExistingIssues（用于计划任务）
  if (require.main === module) {
    (async () => {
      try {
        await inviteExistingIssues();
      } catch (error) {
        console.error('Error processing existing issues:', error);
      }
    })();
  }
})();