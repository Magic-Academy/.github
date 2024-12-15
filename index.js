require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 定义日志文件的路径
// Define the path for the log file
const LOG_FILE_PATH = path.resolve(__dirname, './error.log');

/**
 * 记录错误信息到日志文件
 * Log error message to the log file
 * @param {Error} error - 捕获到的错误对象 / Captured error object
 */
function logError(error) {
  // 获取当前时间戳
  // Get the current timestamp
  const timestamp = new Date().toISOString();
  // 构建错误消息字符串
  // Construct the error message string
  const errorMessage = `${timestamp} - ERROR: ${error.message}\n${error.stack}\n`;
  // 将错误消息追加到日志文件中
  // Append the error message to the log file
  fs.appendFileSync(LOG_FILE_PATH, errorMessage);
}

/**
 * 获取GitHub组织的所有成员
 * Fetch all members of the GitHub organization
 * @returns {Promise<Array>} 成员数组 / Array of members
 */
async function getMembers() {
  const allMembers = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      // 发送HTTP请求获取成员列表
      // Send HTTP request to fetch the list of members
      const response = await fetch(`https://api.github.com/orgs/Magic-Academy/members?per_page=${perPage}&page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${process.env.PROFILE_STATS_TOKEN}`
        }
      });

      // 检查响应是否成功
      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }

      // 解析JSON响应
      // Parse JSON response
      const members = await response.json();

      // 如果没有更多成员，退出循环
      // If there are no more members, exit the loop
      if (members.length === 0) {
        break;
      }

      // 将新获取的成员添加到所有成员数组中
      // Add newly fetched members to the allMembers array
      allMembers.push(...members);
      page++;
    }
  } catch (error) {
    // 控制台输出错误信息
    // Output error message to the console
    console.error('Error fetching GitHub members:', error);
    // 记录错误信息到日志文件
    // Log error message to the log file
    logError(error);
  }

  return allMembers;
}

/**
 * 更新README.md文件中的成员表格
 * Update the members table in README.md
 */
async function updateReadme() {
  const members = await getMembers();

  // 如果没有成员或发生错误，返回
  // If no members are found or an error occurs, return
  if (!members || members.length === 0) {
    console.log('No members found or an error occurred.');
    return;
  }

  // 开始构建成员表格HTML
  // Start building the members table HTML
  let membersTable = '<!-- members -->\n<table><tr>\n';

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    // 每4个成员换行
    // Break line every 4 members
    if (i % 4 === 0 && i !== 0) {
      membersTable += '</tr>\n<tr>\n';
    }

    // 添加每个成员的信息到表格中
    // Add each member's information to the table
    membersTable += `<td align="center" style="word-wrap: break-word; width: 150px; height: 150px">
<a href="${member.html_url}">
<img src="${member.avatar_url}" width="100" style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt="${member.login}"/>
<br />
<sub style="font-size:14px"><b>${member.login}</b></sub>
</a>
</td>\n`;
  }

  // 结束构建成员表格HTML
  // End building the members table HTML
  membersTable += '</tr>\n</table>\n<!-- endmembers -->';

  try {
    // 定义README.md文件的路径
    // Define the path for README.md file
    const readmePath = path.resolve(__dirname, './README.md');
    // 读取README.md文件内容
    // Read the content of README.md file
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    // 替换README.md中的成员表格部分
    // Replace the members table part in README.md
    const updatedReadmeContent = readmeContent.replace(/<!-- members -->[\s\S]*<!-- endmembers -->/, membersTable);
    // 写入更新后的内容到README.md文件
    // Write the updated content back to README.md file
    fs.writeFileSync(readmePath, updatedReadmeContent);

    console.log('README.md has been successfully updated with the latest members list.');
  } catch (error) {
    // 控制台输出错误信息
    // Output error message to the console
    console.error('Error updating README.md:', error);
    // 记录错误信息到日志文件
    // Log error message to the log file
    logError(error);
  }
}

// 调用updateReadme函数开始执行脚本
// Call the updateReadme function to start the script
updateReadme();



