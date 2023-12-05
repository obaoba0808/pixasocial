import bcrypt from "bcryptjs";
import templateModal from "./models/templateModal";
import postModel from "./models/postModel";
const userModel = require("./models/userModel");
const {handleError ,updateReqResp , dbQuery , customValidator} = require("./lib/commonLib");
const { sendMail} = require("./lib/commonLib");
const mongoose  = require('mongoose');
export default async function handler(req, res) {
    try{
        if(req.method == 'POST'){
            if(req.body.action=="sendEmail")
            {
                sendEmailToAll(req,res)
            }
            else
            {
                addNewUser(req, res);
            }
        }else if(req.method == 'PUT'){
            updateUsersList(req, res);
        }else if(req.method == 'GET'){
            if(req.query.action=="user_analytics")
            {
                userAnalytics(req, res);
            }else{
                getUsersList(req, res);
            }
        }else if(req.method == 'DELETE'){
            deleteUser(req, res);
        }
    }catch (error){
        handleError(error , 'AuthAPI');
    }
}

let addNewUser = (req, res) => {
    customValidator(
    {
        data: req.body,
        keys: {
            name: {
                require: true,
            },
            email: {
                require: true,
                validate: "email",
            },
            password: {
                require: true,
            },
           
        },
    },
    req,
    res,
    async ({authData} = validateResp) => { 
        let {name , email , password,role,lastname} = req.body;
        dbQuery.select({
            collection : userModel,
            where : {
                email
            }, 
            limit : 1, 
            keys : '_id'
        }).then(async checkUser => {
            if(checkUser){
                res.status(401).json({ 
                    status : 0,
                    message : 'Email is already exist with us, please try with another email.'
                })
            }else{
                let insData = {
                    name, 
                    email : email.toLowerCase(), 
                    password : await bcrypt.hash(password, 5),
                    status : 1,
                    source : 'Manually',
                    lastname : lastname
                };

                if(role)
                {
                    insData.role=role
                }

                if(authData.role == 'User'){
                    insData.parentId = authData.id;
                }

                dbQuery.insert({
                    collection : userModel,
                    data : insData
                }).then(async(ins) => {

                    let mailData={
                        from : process.env.MANDRILL_EMAIL,
                        to :  email.toLowerCase(),
                        subject : "Welcome",
                        htmlbody : `<div style="max-width: 600px ;
                        padding:25px;background-color: #f6f6ff;
                        border-radius: 30px; 
                        margin: 0 auto;
                        border-radius: 10px; 
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); 
                        font-size: 15px;
                        line-height: 25px;
                        color: #29325f;
                        font-weight: 400;">
                            <div style="text-align: center;">
                                <h3 style="margin-top: 5px; color: #29325f;">PixaSocial</h3>
                            </div>
                            <p> Hi <span style="color: ff776b;"><b> ${name} ${lastname},</b></span>  <br />
                        
                        
                                Welcome to PixaSocial. Your account is created by ${process.env.SITE_TITLE}, <br/> You can login to your account using following details:<br/><br/>
                        
                                 <b>Login URL: </b> ${process.env.LIVE_URL} <br/>
                        
                                 <b>Email : </b>${email.toLowerCase()} <br/>
                                
                                 <b>Password :</b>  ${password}<br />
                        
                            </p>
                            <div style="background:#ffffff ; padding: 15px 20px; border-radius: 20px;font-size: 14px;
                            line-height: 25px;
                            color: #8386a5;
                            font-weight: 400;"><span> Thank you for being a loyal customer : <b>The ${process.env.SITE_TITLE} Team</b></span></div>
                        </div>`
                     };
                    let d1=await sendMail(mailData,"service")

                    res.status(200).json({ 
                        status : true,
                        message : 'User added successfully.'
                    })
                });
            }
            
        });
    });
};


let updateUsersList = (req, res) => {
    customValidator(
    {
        data: req.body,
        keys: {
            target: {
                require: true,
            },
            name: {
                require: true,
            },
            email: {
                require: true,
                validate: "email",
            },
      
        },
    },
    req,
    res,
    async ({authData} = validateResp) => { 
        let {name,lastname, email, contactNumber, password, status, target, role } = req.body;
        dbQuery.select({
            collection : userModel,
            where : {
                _id : target
            }, 
            limit : 1, 
            keys : '_id'
        }).then(async checkUser => {
            if(!checkUser){
                res.status(401).json({ 
                    status : 0,
                    message : 'User not exist.'
                })
            }else{
                let updData = {
                    name,  
                    status,
                    contactNumber,
                    lastname, 
                    role
                };

                if(password){
                    updData.password = await bcrypt.hash(password, 5);
                }

                dbQuery.update({
                    collection : userModel,
                    data : updData,
                    where : {
                        _id : target
                    },
                    limit : 1
                }).then(ins => {
                    if(req.body.action=="status")
                    {
                        res.status(200).json({ 
                            status : true,
                            message : 'User status updated successfully',
                            data : ins
                        })
                    }else{
                        res.status(200).json({ 
                            status : true,
                            message : 'User updated successfully.',
                            data : ins
                        })
                    }
                   
                });
            }
            
        });
    });
};


let getUsersList = (req, res) => {
    customValidator(
    { },
    req,
    res,
    async ({authData} = validateResp) => {

        let {keys , page , limit , keyword, sort } = req.query,
        where = {}; 

        if(authData.role == 'User'){
            where.parentId =  authData.id;
        }

        if(keyword && keyword.trim() != ''){
            where = {
                $or : [
                    {'name' : { $regex : new RegExp(keyword, "i")},},
                    {'email' : { $regex : new RegExp(keyword, "i")}},
                ]
            }
        }

        dbQuery.select({
            collection : userModel,
            where, 
            limit,
            keys,
            page, 
            sort
        }).then(async users => {
            let count =  limit == 1 ? 1 : await dbQuery.count({
                collection : userModel,
                where,
            });


            res.status(200).json({ 
                status : true,
                message : '',
                data : users,
                totalRecords : count,
                fetchedRecords : limit == 1 ? 1 : users.length
            })
        });
    })
}



let deleteUser = (req, res) => {
    customValidator(
    {
        data: req.query,
        keys: {
            target: {
                require: true,
            }
        },
    },
    req,
    res,
    async ({authData} = validateResp) => { 
        let { target } = req.query;
        dbQuery.select({
            collection : userModel,
            where : {
                _id : target
            }, 
            limit : 1, 
            keys : '_id'
        }).then(async checkUser => {
            if(!checkUser){
                res.status(401).json({ 
                    status : 0,
                    message : 'User not found.'
                })
            }else{

                dbQuery.delete({
                    collection : userModel,
                    where : {
                        _id : target
                    },
                    limit : 1
                }).then(ins => {
                    res.status(200).json({ 
                        status : true,
                        message : 'User deleted successfully.'
                    })
                });
            }
            
        });
    });
};


let sendEmailToAll= (req,res)=>{
    customValidator(
        { },
        req,
        res,
        async ({authData} = validateResp) => {
    
            let {contain,list} = req.body,
            where = {}; 
            if(list)
            {
                where["$in"]=list
            }
    
            dbQuery.select({
                collection : userModel,
                where, 
                keys : "name,email"
            }).then(async users => {

                for(let i=0;i<users.length;i++)
                {
            let mailData={
                        from : "noreply@plannero.io",
                        to : users[i].email,
                        subject : "Reset Password",
                        htmlbody : `<h1>Dear ${users[i].email},
                        ${contain}
                        .</h1>`
                     };
                    let d1=await sendMail(mailData,"service")
                }

                res.status(200).json({ 
                    status : true,
                    message : '',
                    data : users,
                })
            });
        })
}


let userAnalytics=(req,res)=>{
    customValidator(
        { },
        req,
        res,
        async ({authData} = validateResp) => {
    
            let {keys , page , limit , keyword, sort,target } = req.query,
            where = {}; 
            where._id = target;

            let data ={}


            let userdata =await dbQuery.select({
                collection : userModel,
                where, 
                limit :1,
                keys,
                page, 
                sort
            })
            let posts = await dbQuery.select({
                collection : postModel,
                where : {userId :target}, 
                limit :5,
                sort
            })

            let postbysocialmedia=await dbQuery.aggregate({
                collection : postModel,
                aggregateCnd : [
                    {
                    $match: {
                      "userId": new mongoose.Types.ObjectId(target)
                    }
                  },
                  {
                    $unwind: "$socialMediaAccounts"
                  },
                  {
                    $group: {
                      _id: {plateform:"$socialMediaAccounts.type",
                          status : "$status",
                      },
                      count: { $sum: 1 }
                    }
                  },
                  {
                    $project: {
                      _id: 0,
                      socialMedia: "$_id",
                      count: 1
                    }
                  }
                ]
            })
            let socialDetail=[]
            postbysocialmedia.map((d1)=>{
                socialDetail.push(
                {count : d1.count,
                ...d1.socialMedia
                })
            })
            data.userDetails=userdata
            data.posts=posts
            data.socialMedia=socialDetail
                res.status(200).json({ 
                    status : true,
                    message : '',
                    data : data,
                })
        })
}

