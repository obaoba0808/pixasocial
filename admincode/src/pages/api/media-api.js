const { handleError, dbQuery , customValidator , convertToSlug , objectToQuery} = require("./lib/commonLib");
const mediaModel = require("./models/mediaModel");
const axios = require("axios");
let localTempFilePath = '/';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb' ,
        }
    }
}
export default async function handler(req, res) {
    try{
        if(req.method == 'POST'){
            addMediaToLibrary(req, res);
        } else if (req.method == "PUT") {
            updateMedia(req, res);
          }
    }catch (error){
        handleError(error , 'MediaAPI');
    }
}



let addMediaToLibrary = (req, res) => {
    
    const path = require( 'path' );
    const fs = require("fs");
    const https = require('https');
    const sizeOf = require('image-size');
    const {uploadLocalFileToS3} = require('./lib/AWS-Actions');


    customValidator(
    { 
        data: req.body,
        keys: {
            mediaType: {
                require: true,
            },
            source: {
                require: true,
            },
            src: {
                require: true,
            },
       
        },
    },
    req,
    res,
    async ({authData} =validateResp) => {

        let {mediaType , source, sourceId , src, tags , title, videoSrc, videoTitle, meta } = req.body;

        try {

            dbQuery.select({
                collection : mediaModel,
                where : {
                    source,
                    sourceId
                }, 
                limit : 1, 
                keys : 'path,meta'
            }).then(async checkMedia => {

                if(!checkMedia){

                    title = title.split(" ").join("-");
                    let newFileName = Math.floor(Math.random() * 1000)+""+Date.now()+path.extname(title)
                    const newLocation = localTempFilePath+newFileName; 
                    return new Promise((resolve, reject) => {
                        https.get(src,(resp) => {
                            const filePath = fs.createWriteStream(newLocation);
                            resp.pipe(filePath);
                            filePath.on('finish', async() => {
                                filePath.close(); 

                                let mediaMeta = meta;
                                if(mediaType == 'image'){
                                    const dimensions = sizeOf(newLocation);
                                    mediaMeta = {
                                        width : dimensions.width,
                                        height : dimensions.height
                                    };
                                }
                                
                                let fileKey = `assets/${mediaType == 'image' ? 'images' : 'videos'}/${newFileName}`;

                                uploadLocalFileToS3({
                                    Key: fileKey, 
                                    Body: newLocation,
                                    ContentType: "image/"+path.extname(title),
                                }).then(async (uplData) => {

                                    let insMediaData = {
                                        title,
                                        userId : authData.id,
                                        path : fileKey,
                                        tags,
                                        type : mediaType,
                                        meta : mediaMeta,
                                        source, 
                                        sourceId,
                                    };

                                    if(mediaType == 'image'){
                                        dbQuery.insert({
                                            collection : mediaModel,
                                            data : insMediaData
                                        }).then(async addNewMedia => {
                                            fs.unlinkSync(newLocation); 
                                            res.status(200).json({ 
                                                status : true,
                                                message : 'Image added successfully.',
                                                target : {
                                                    path : fileKey,
                                                    meta : mediaMeta,
                                                }
                                            });
                                        }); 
                                    }else{
                                        insMediaData.thumb = fileKey;
                                        insMediaData.title = videoTitle;
                                         
                                        let vidName = Math.floor(Math.random() * 1000)+""+Date.now()+path.extname(videoTitle);
                                        const vidLocation = localTempFilePath+vidName; 

                                        const response = await axios({
                                            method: 'GET',
                                            url: videoSrc+"&download=1",
                                            responseType: 'stream',
                                        });
                                        
                                        const w = response.data.pipe(fs.createWriteStream(vidLocation));

                                        w.on('finish', async() => {
                                            
                                            let videoKey = `assets/videos/${vidName}`;
                                            
                                            uploadLocalFileToS3({
                                                Key: videoKey, 
                                                Body: vidLocation,
                                                ContentType: "video/"+path.extname(videoTitle),
                                            }).then(async (uplData) => {
                                                

                                                insMediaData.path = videoKey;

                                                dbQuery.insert({
                                                    collection : mediaModel,
                                                    data : insMediaData
                                                }).then(async addNewMedia => {
                                                    
                                                    fs.unlinkSync(newLocation); 
                                                    fs.unlinkSync(vidLocation); 

                                                    res.status(200).json({ 
                                                        status : true,
                                                        message : 'Image added successfully.',
                                                        target : {
                                                            path : videoKey,
                                                            meta : mediaMeta,
                                                        }
                                                    });
                                                }); 
                                            });
                                        
                                        });
                                    }
                                    
                                });
                            });
                        });
                    })
                }else{
                    res.status(200).json({ 
                        status : true,
                        message : 'Image added successfully.',
                        target : {
                            path : checkMedia.path,
                            meta : checkMedia.meta,
                        }
                    });
                }
            });
            
            
        } catch(err) {
            handleError(error , 'UploadFile');
        } 

        
        
    })
}


let updateMedia =(req, res)=>{
    try {
    customValidator(
        { 
            data: req.body,
            keys: {
            },
        },
        req,
        res,
        async ({authData} = validateResp) => {
            if(authData.role=="User"){
                handleError("User is not authorize.");
                return;
            }

            let {data,target} = req.body
            let d1 =[]

           let d2=await dbQuery.select({
                collection : mediaModel,
                where : {_id :target}, 
                keys : '_id',
                limit : 1
            })
            if(d2){
                dbQuery.update({
                    collection : mediaModel,
                    where :  {"_id" :target},
                    data : {$set :data},
                }).then(async checkMedia => {
                    res.status(200).json({ 
                        status : true,
                        message : 'Asset updated successfully.',
                    })
                })
            }else{
                handleError("Asset not found.");
            }
          
       })
    }
    catch(e){
        res.status(200).json({ 
            status : true,
            message : e,
        })
    }
}