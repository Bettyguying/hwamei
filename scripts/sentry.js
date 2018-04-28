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
const cronJob = require('cron').CronJob
const wxwork = require('../lib/wxwork')
const request = require('request')

const SENTRY_BASE_URL = process.env.SENTRY_BASE_URL
const SENTRY_AUTH_HEADER = {
  'Authorization': `Bearer ${process.env.SENTRY_TOKEN}`
}

const projectToChats = {
  'uniqueway/cure': 'cure',
  'uniqueway/unicrm': 'unicrm',
  'uniqueway/unicrm_backend': 'unicrm',
  'uniqueway/dist_backend': 'dist',
  'uniqueway/dist_frontend': 'dist',
  'uniqueway/similan_backend': 'similan',
  'uniqueway/traveler-api': 'traveller',
  'uniqueway/traveler-frontend': 'traveller',
  'uniqueway/uniapp': 'uniapp',
  'uniqueway/www': 'www',
  'uniqueway/deal_distrubition': 'DealDistribution',
  'uniqueway/shallowPlan': 'research'
}

module.exports = (robot) => {
  const tz = 'Asia/Shanghai'
  new cronJob('0 11 * * * *', reportAllProjectStats, null, true, tz)

  robot.hear(/sentry report for (.*)/, (res) => {
    const project = res.match[1]
    reportProjectStats(project)
  })

  robot.hear(/sentry report all/, (res) => {
    reportAllProjectStats()
  })
}

function reportProjectStats(project) {
  const chatId = projectToChats[project]
  reportProjectStatToChat(chatId, project)
}

function reportAllProjectStats() {
  for(project in projectToChats) {
    const chatId = projectToChats[project]
    reportProjectStatToChat(chatId, project)
  }
}

function reportProjectStatToChat(chatId, project) {
  request({
    url: `${SENTRY_BASE_URL}/api/0/projects/${project}/issues/?statsPeriod=24h`,
    headers: SENTRY_AUTH_HEADER
  }, (error, response, body) => {
    try {
      let periods = JSON.parse(body)
      let count = periods.length
      let message = `【sentry】${project} `

      if (count == undefined) {
        message += `应该是不存在`
      } else if (count == 0) {
        message += `到目前为止没有任何错误，非常非常棒！继续保持啊！`
      } else {
        message += `到目前为止还有 ${count} 个错误没有得到解决。`
      }

      message += `${SENTRY_BASE_URL}/${project}`

      console.log(message)
      wxwork.sendMessage(chatId, message)
    } catch(error) {
      console.log(project)
      console.error(error)
    }
  })
}
