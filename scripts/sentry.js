// Description:
//   sentry commands
//
// Dependencies:
//   cron
//   request
//
// Configuration:
//   none
//
// Commands:
//   sentry report

require('dotenv').config()
const tz = 'Asia/Shanghai'
const cronJob = require('cron').CronJob
const request = require('request')

const SENTRY_BASE_URL = process.env.SENTRY_BASE_URL
const SENTRY_AUTH_HEADER = {
  'Authorization': `Bearer ${process.env.SENTRY_TOKEN}`
}

module.exports = (robot) => {

  // new cronJob('* * * * * *', reportSentryExceptionStats, null, true, tz) // 注册定时任务

  robot.hear(/sentry report for (.*)/, (res) => {
    const chatId = res.match[1]
    const message = buildReportMessage(chatId)
    sendMessage(chatId, message)
  })
}

async function sendMessage(chatId, message){
  const response = await wxwork.sendMessage(chatId, message)
  if (response.ok) {
    return 'Message was send'
  } else {
    return response.message
  }
}

function sentryReport() {
  request({
    url: `${SENTRY_BASE_URL}/projects/`,
    headers: SENTRY_AUTH_HEADER
  }, (error, response, body) => {
    let projects = JSON.parse(body)
    let lines = []
    for (let project of projects) {
      const since = new Date().setHours(0, 0, 0, 0) / 1000
      const count = fetchProjectExceptionCount(project, since)
      lines.push(`项目: ${project['name']}，今天到目前为止共有 ${count} 个错误`)
    }

    return lines.join("\n")
  })
}

function fetchProjectExceptionCount(project, since) {
  request({
    url: `${SENTRY_BASE_URL}/${project['slug']}/stats/?since=${since}`,
    headers: SENTRY_AUTH_HEADER
  }, (error, response, body) => {
    let count = 0
    let periods = JSON.parse(body)

    for (let period of periods) {
      count += period[1]
    }

    return count
  })
}
