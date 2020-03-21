const apiRouter = require('express').Router()


const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

const cors = require('cors')

// This will be enlisted on any routes below this line 
// This will configure all of the routes that are listed below this, to set the Cross Site Resource Sharing Policy to allow any domain to access it.
apiRouter.use(cors())

apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername)

module.exports = apiRouter