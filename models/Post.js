const postsCollection = require('../db').db().collection('posts')
//  Store ID's in Mongo Object ID Format 
const ObjectID = require('mongodb').ObjectID

const User = require('./User')

// Constructor Function
let Post = function (data, userid, requestedPostId) {

    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId

}


Post.prototype.cleanUp = function() {

    if (typeof(this.data.title) != 'string') {this.data.title = ''}
    if (typeof(this.data.body) != 'string') {this.data.body = ''}

    // Get Rid Of Any Bogus Properties

    this.data = {
      title: this.data.title.trim(),  
      body: this.data.body.trim(),
      createdDate: new Date(),
      author: ObjectID(this.userid)
    }

}

Post.prototype.validate = function() {

        if(this.data.title == '') {
            this.errors.push("You must provide a title")
        }

        if(this.data.body == '') {
            this.errors.push("You must provide post content")
        }
    

}

Post.prototype.create = function() {

    return new Promise( (resolve,reject) => {
        this.cleanUp()
        this.validate()

        //  Check errors array 

        if (!this.errors.length) {
            //  Save post into database - Mongo DB returns promises
            postsCollection.insertOne(this.data).then( () => {
                resolve()
            }).catch(() => {
                this.errors.push('Please try again later')
                reject(this.errors)
            })
            
        } else{
            reject(this.errors)
        }

    })

}

Post.prototype.update = function () {
    return new Promise(async(resolve,reject) => {

        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
             if (post.isVisitorOwner) {
                //Actually Update The DB
                let status = await this.actuallyUpdate()
                resolve(status)
             } else{
                reject()
             }
        }catch(err){
            reject(err)
        }

    })
}

Post.prototype.actuallyUpdate = function () {
    return new Promise (async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}} )
            resolve('success')
        }else{
            resolve('failure')
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise( async function (resolve, reject) {

        //  Concat returns a new array and with that arg passed inside its paranthesis and add it to original array
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as:'authorDocument'}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: '$author', //dollar sign author means to MONGOdb use field
                author: {$arrayElemAt: ['$authorDocument', 0]}
            }}
        ])
 
        //Mongo DB CRUD Function 
        //Code needs to return a Promise, because talking to the DB is an async process - that is why we ended the line with toArray() which returns a promise
        //aggregate lets us run mutliple instructions - we pass it an array of multiple DB options
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // Clean Up Author Prop In Each Post Obj
        posts = posts.map(function(post){
            //post.authorId is a mongo object
            post.isVisitorOwner = post.authorId.equals(visitorId) 
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }

            return post
        })
            resolve(posts)
    })
}

Post.findSingleById = function (id, visitorId) {
    return new Promise( async function (resolve, reject) {

        if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
            reject()
            return
        }

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

            if (posts.length) {
                console.log(posts[0])
                resolve(posts[0])
            } else {
                reject()
            }
        })
}

Post.findByAuthorId = function(authorId) {

    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        //1 asc / -1 desc 
        {$sort: {createdDate: -1}}
    ])

}



module.exports = Post