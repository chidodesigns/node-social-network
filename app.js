const express = require('express')
const app = express()
const router = require('./router')

//  [ two most common ways of accepting data across the web ]
//  Boilerplate Code add user submitted data onto our request object so we can access it via req.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//  Make public files accessible (css/browserJS)
app.use(express.static('public'))
//  Render template file 1st Argument Express option called views [ 2nd Argument is the folder to look in ]
app.set('views', 'views')
//  Which templating engine we are using - 2nd Arg which template engine we are using
//  We tell express to use the EJS template engine - install via NPM
app.set('view engine', 'ejs')

app.use('/', router)

app.listen(3000)
