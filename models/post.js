var mongodb = require("./db.js"),
    markdown = require('markdown').markdown;

function Post(name,title,tags,post){
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
};

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种时间格式，以便以后扩展
    var time ={
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() +1),
        day: date.getFullYear() + '-' + (date.getMonth() +1) + date.getDay(),
        minute: date.getFullYear() + '-' + (date.getMonth() +1) + date.getDay()  + date.getHours() +":" + date.getMinutes()<10 ? '0'+ date.getMinutes() : date.getMinutes()
    }
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv:0
    };
    //打开数据库
    mongodb.open(function(err,db){
       if(err){
           return callback(err);
       }
        //读取posts集合
        db.collection("posts",function(err,collection){
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回 err 为 null
            });
        });
    });
};

//读取文章及其相关信息
Post.getTen  = function(name,page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.count(query,function(err,total){
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query,{
                    skip: (page -1) *10,
                    limit:10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);//失败！返回 err
                    }
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs,total);//成功！以数组形式返回查询的结果
              })
            });
        });
    });
};

Post.getOne = function(name,day,title,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名，发表日期及文章名进行查询
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function (err,doc){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                //解析markdown 为html
                if(doc){
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $inc: {"pv":1}
                    },function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });
                    doc.post =markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    })
                    callback(null,doc);//返回查的一篇文章
                }
            })
        })
    })
}

Post.edit = function(name,day,title,callback){
    //打开数据库
    mogodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection("post",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根椐用户名，发表日期及文章名进行查询
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);//返回查询的一篇文章(markdown格式）
            })
        })
    })
}

Post.update = function(name,day,title,post,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection("post",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.day":day,
                "title":title
            },{
                $set:{post:post}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

Post.remove =function(name,day, title, callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{
                w:1
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
            callback(null);
        })
      })
    })
  }

//getArchive
Post.getArchive = function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err)
            }
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

//返回所有标签
Post.getTags = function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }

        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags",function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}

Post.search = function(keyword,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword,"i");
            collection.find({
               "title": pattern
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}