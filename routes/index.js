//var express = require('express');
//var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res) {
//  res.render('index', { title: 'Express' });
//});
//module.exports = router;

var crypto = require('crypto'),
     User = require('../models/user.js'),
     Post = require('../models/post.js'),
     Comment = require('../models/comment.js');

module.exports= function(app){
    app.get("/",function(req,res){
        var page  = req.query.p ? parseInt(req.query.p) : 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
        res.render("index",{
            title:"主页",
            user: req.session.user,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
     })
    });

    //login ：用户登录
    app.get("/login",checkNotLogin);
    app.get('/login',function(req,res){
      res.render('login',{
          title:"用户登录",
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
      })
    })
    app.post("/login",checkNotLogin);
    app.post('/login',function(req,res){
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
             if(!user){
                 req.flash("error","用户不存在");
                 return res.redirect("/login");
             }
            if(password != user.password){
                req.flash("error","密码错误")
                return res.redirect("/login");
            }
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');
        });
    });

    //reg ：用户注册
    app.get("/reg",checkNotLogin);
    app.get('/reg',function(req,res){
      res.render('reg',{
          title:"用户注册",
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
      })
    });
    app.post("/reg",checkNotLogin);
    app.post('/reg',function(req,res){
       var name = req.body.name,
           password = req.body.password,
           password_re = req.body["password-repeat"];
        if(password_re !=password ){
            req.flash("error","两次输入的密码不一致！");
            return res.redirect("/reg");//返回注册页
        }
        //生成密码的md5值
        var md5 = crypto.createHash("md5"),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });

        //检查用户名是否存在
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash("error",err);
                return res.redirect("/reg");
            }
            if(user){
                req.flash("error","用户名己存在");
                return res.redirect("/reg");
            }
            //如果不存在则新增用户
            newUser.save(function(err,user){
                if(err){
                    req.flash("error".err);
                    return res.redirect("/reg");
                }
                req.session.user = user;//用户信息存入session
                req.flash("success","注册成功");
                res.redirect("/");//注册成功跳至首页
            });
        });
    })

    //post ：发表文章
    app.get('/post', checkLogin);
    app.get('/post',function(req,res){
      res.render('post',{
          title:'发表文章',
          user:req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
      })
    });

    app.post('/post', checkLogin);
    app.post('/post',function(req,res){
        var currentUser = req.session.user,
            tags = [req.body.tag1,req.body.tag2,req.body.tag3];
            post = new Post(currentUser.name, req.body.title,tags, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');//发表成功跳转到主页
        });
    });

    app.get("/archive",function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            res.render("archive",{
                title:"存档",
                posts:posts,
                user:req.session.user,
                success:req.flash("success").toString(),
                error:req.flash("error").toString()
            })
        })
    })

    app.get("/tags",function(req,res){
        Post.getTags(function(err,posts){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            res.render("tags",{
                title:"标签",
                posts:posts,
                user:req.session.user,
                success: req.flash("success").toString(),
                error:req.flash("error").toString()
            })
        })
    })

    app.get("/tags/:tag",function(req,res){
        Post.getTag(req.params.tag,function(err,posts){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            res.render("tag",{
                title:"TAG:" + req.params.tag,
                posts:posts,
                user:req.session.user,
                success:req.flash("success").toString(),
                error: req.flash("error").toString()
            })
        })
    })

    app.get("/search",function(req,res){
        Post.search(req.query.keyword,function(err,posts){
            if(err){
                return res.redirect("/");
            }
            res.render('search',{
                title:"SEARCH:" + req.query.keyword,
                posts:posts,
                user: req.session.user,
                success:req.flash("sucess").toString(),
                error: req.flash("error").toString()
            })
        })
    })

    app.get("/u/:name",function(req,res){
        //检查用户是否存在
        User.get(req.params.name,function(err,user){
            var page = req.query.q ? parseInt(req.query.p) : 1;
            if(!user){
                req.flash("error","用户名不存在！");
                return res.redirect("/");用户不存在则跳转到主页
            }
            //查并返回该用户的所有文章
            Post.getTen(user.name,page,function(err,posts,total){
                if(err){
                    req.flash("error",err);
                    return res.redirect("/");
                }
                res.render("user",{
                    title: user.name,
                    posts:posts,
                    page:page,
                    user: req.session.user,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1)*10 + posts.length) == total,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                })
            })
        })
    })

    app.get("/u/:name/:day/:title",function(req,res){
        Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            res.render("article",{
                title: req.params.title,
                post: post,
                user:req.session.user,
                success: req.flash("success").toString(),
                error:req.flash("error").toString()
            })
        })
    })

    app.post("/u/:name/:day/:title",function(req,res){
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1 ) + "-" + date.getDate() +" " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" +date.getMinutes() :date.getMinutes());
        var comment = {
            name:req.body.name,
            email:req.body.email,
            website:req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
        newComment.save(function(err){
            if(err){
                req.flash("error",err);
                return res.redirect("back");
            }
            req.flash("success","留言成功!");
            res.redirect("back");
        });
    });

    app.get("/edit/:name/:day/:title",checkLogin);
    app.get("/eidt/:name/:day/:title",function(req,res){
        var currentUser = req.session.user;
        Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash("error",err);
                return res.redirect("back");
            }
            res.render("edit",{
                title:"编辑",
                post:post,
                user:req.session.user,
                success:req.flash("success").toString(),
                error:req.flash("error").toString()
            })
        })
    })

    app.post("/edit/:name/:day/:title",checkLogin);
    app.post("/eidt/:name/:day/:title",function(req,res){
        var currrentUser = req.session.user;
        Post.update(currrentUser.name, req.params.day,req.params.title,req.body.post,function(err){
            var url = encodeURI("/u"+req.params.name +"/"+req.params.day + "/" + req.params.title);
            if(err){
                req.flash("error",err);
                return res.redirect(url);//出错，返回文章页
            }
            req.flash("success","修改成功!");
            req.redirect(url); //成功，返回文章页
        })
    })

    app.get("/remove/:name/:day/:title",checkLogin);
    app.get("/remove/:name/:day/:title",function(req,res){
        var currentUser = req.session.user;
        post.remove(
            currentUser.name,req.params.day,req,params.title,function(err){
            if(err){
                req.flash("error",err);
                return res.redirect("back");
            }
            req.flash("success","删除成功！");
            res.redirect("/");
        })
    })

    //logout ：登出
    app.get('/logout', checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect("/");
    });

    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
        res.render('upload',{
            title:"文件上传",
            user:req.session.user,
            success: req.flash("success").toString(),
            error:req.flash("error").toString()
        })
    })

    app.post('/upload',checkLogin);
    app.post('/upload',function(req,res){
        req.flash("success","文件上传"),
        res.redirect("/upload");
    })

    //判断登录
    function checkLogin(req,res,next){
        if(!req.session.user){
            req.flash("未登录");
            res.redirect("/login");
        }
        next();
    };

    //判断未登录
    function checkNotLogin(req,res,next){
        if(req.session.user){
            req.flash("己登录");
            res.redirect("back");
        }
        next();
    }
}


