/*
 * @Descripttion: 
 * @version: 
 * @Author: 松岛川树
 * @Date: 2021-12-14 05:10:12
 * @LastEditors: songdaochuanshu songdaochuanshu@gmail.com
 * @LastEditTime: 2022-07-26 10:29:18
 * @FilePath: \.github\index.js
 */
require('dotenv').config()
const fetch = require('node-fetch')
const fs = require('fs');
const path = require('path');

// const getMembers = async() => {
//         let res = await fetch(`https://api.github.com/orgs/Magic-Academy/members?per_page=100`, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `token ${process.env.PROFILE_STATS_TOKEN}`
//             }
//         })
//         let data = await res.json();
//         return data;
//     }
(
    async function () {
            var membersArr = [];
            for (let i = 1; i <= 4; i++) {
                fetch(`https://api.github.com/orgs/Magic-Academy/members?per_page=100&page=${i}`, {
                        method: 'GET',
                        // headers: {
                        //     'Authorization': `token ${process.env.PROFILE_STATS_TOKEN}`
                        // }
                    })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (membersJson) {
                        membersArr.push(membersJson[0]);
                        return membersArr
                    }).then(
                        function (members) {
                            console.log(members);

                            const readme = fs.readFileSync(path.resolve(__dirname, './README.md'), 'utf-8');
                            const newReadme = readme.replace(/<!-- members -->[\s\S]*<!-- endmembers -->/,
                                `<!-- members -->
<table><tr>${members.map((key, index) => {
                                if (index % 4 === 0) {
                                        return `\n</tr>\n<tr>
<td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
<a href="${key.html_url}">
<img src="${key.avatar_url}" width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=${key.name}/>
<br />
<sub style="font-size:14px"><b>${key.login}</b></sub>
</a>
</td>`
                                }
                                else {
                                        return ` < td align = "center"
                                style = "word-wrap: break-word; width: 150.0; height: 150.0" >
                                <
                                a href = "${key.html_url}" >
                                <
                                img src = "${key.avatar_url}"
                                width = "100;"
                                style = "border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px"
                                alt = $ {
                                    key.name
                                }
                                /> <
                                br / >
                                <
                                sub style = "font-size:14px" > < b > $ {
                                    key.login
                                } < /b></sub >
                                <
                                /a> <
                                /td>`
                            }
                        }).join('\n')
            } <
            /tr> <
            /table> <
            !--endmembers-- > `);
                fs.writeFileSync(path.resolve(__dirname, './README.md'), newReadme);
            }
        )
}

        }
)()