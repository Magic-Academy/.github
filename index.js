
require('dotenv').config()
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function getMembers() {
  let allMembers = [];
  let page = 1;
  let perPage = 100;
  let members = [];
  do {
    const res = await fetch(`https://api.github.com/orgs/Magic-Academy/members?per_page=${perPage}&page=${page}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.PROFILE_STATS_TOKEN}`
      }
    });
    members = await res.json();
    allMembers = allMembers.concat(members);
    page++;
  } while (members.length === perPage);
  return allMembers;
}

async function updateReadme() {
  const members = await getMembers();
  let membersTable = '<!-- members -->\n<table><tr>\n';
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (i % 4 === 0 && i !== 0) {
      membersTable += '</tr>\n<tr>\n';
    }
    membersTable += `<td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
<a href="${member.html_url}">
<img src="${member.avatar_url}" width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt="${member.name}"/>
<br />
<sub style="font-size:14px"><b>${member.login}</b></sub>
</a>
</td>\n`;
  }
  membersTable += '</tr>\n</table>\n<!-- endmembers -->';

  const readme = fs.readFileSync(path.resolve(__dirname, './README.md'), 'utf-8');
  const newReadme = readme.replace(/<!-- members -->[\s\S]*<!-- endmembers -->/, membersTable);
  fs.writeFileSync(path.resolve(__dirname, './README.md'), newReadme);
}

updateReadme();