require('dotenv').config()

const Snoowrap = require('snoowrap')
const { CommentStream } = require('snoostorm')
const axios = require('axios')
const sqlite3 = require('sqlite3')

const db = new sqlite3.Database('database.sqlite')

const client = new Snoowrap({
  userAgent: 'rigfoot',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
})

const comments = new CommentStream(client, {
  subreddit: 'testingground4bots',
  limit: 10,
  pollTime: 2000
})

// async-await query
const query = function (sql, params) {
  const that = this
  return new Promise(function (resolve, reject) {
    that.all(sql, params, function (error, rows) {
      if (error) {
        reject(error)
      } else {
        resolve({ rows })
      }
    })
  })
}
db.query = query

const findComment = commentId => {
  const q = `SELECT * FROM comments WHERE comment_id = "${commentId}"`
  return db.query(q, [])
}

const putComment = commentId => {
  console.log('PUT', commentId)
  db.run(`
    INSERT INTO comments (comment_id)
    VALUES ("${commentId}")
  `)
}

comments.on('item', async comment => {
  // check if already responded
  try {
    const c = await findComment(comment.id)
    console.log('ASDSASASAD', c)
    if (c.rows.length > 0) {
      console.log(`Comment ${comment.id} already handled`)
      return
    }
  } catch (err) {
    console.log('ERR', err)
    return
  }

  const regex = /\/rigfoot (.*)/g
  const query = regex.exec(comment.body)
  if (query && query.length === 2) {
    try {
      const { data } = await axios.post(`https://rigfoot.com/api/pedals?search=${query[1]}`)
      if (data.length === 1) {
        comment.reply(`https://rigfoot.com/pedals/${data[0].id}`)
      } else {
        comment.reply(`https://rigfoot.com/search?s=${query[1].replace(/\s/g, '+')}`)
      }

      putComment(comment.id)
    } catch (err) {
      if (err) {
        console.log(err)
      }
    }
  }
})
