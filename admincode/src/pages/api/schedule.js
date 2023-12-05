const postModel = require("../api/models/postModel")
const {
    dbQuery
  } = require("./lib/commonLib");

const https =require("https")
const axios =require("axios");

const fs =require('fs').promises;
const FormData = require('form-data');

let schedukeCron=async()=>{
    let from = new Date(Date.now() - 1000 * 60 * 10);
    let to = new Date();
    let postData = await dbQuery.select({
        collection: postModel,
        where: {
            postDate: {
                $gte: from,
                $lte: to,
            },
            status: "pending",
            type : {$exists:false}
        },
        limit: 1000,
    });

    for(let i=0;i<postData.length;i++)
    {
       await socialPost(postData[i])
    }
}


let socialPost=async(data)=>{
    let socialAccounts=data.socialMediaAccounts
    let localurl=null
    if(data.url)
    {
       localurl= await downloadVideo(data.url)

    }
  
    for(let i=0;i<socialAccounts.length;i++)
    {
      if(socialAccounts[i].type=="facebook")
      {
        if(data.url){
          await pageFaceBookUpload(socialAccounts[i] ,data,localurl)
        }else{
          await uploadFacebookTextOnly(socialAccounts[i],data.text)
        }
      }else{
        if(socialAccounts[i].type=="instagram"){
          await InstagramUploadPost(socialAccounts[i] ,data)
        }else{
          if(socialAccounts[i].type=="linkedin"){
            if(data.url){
             await  linkedInPost(socialAccounts[i].data.id,socialAccounts[i].data.access_token ,data.text,localurl)
            }else{
              await uploadLinkdinTextOnly(socialAccounts[i] ,data)
            }
          }
          else{
            if(data.url && socialAccounts[i].type=="pinterest"){
              await pinterestPost(socialAccounts[i],data)
            }
          }
        }
      }
    }
      let d1= await dbQuery.update({
                  collection: postModel,
                  data: {status :"Sucess"},
                  where: {
                    _id: data._id,
                  },
                  limit: 1,
                })
  }

  let pageFaceBookUpload = async (data, contain, localUrl) => {
    try {
      return new Promise(async (resolve, reject) => {
        try {
          let pages = data.data.facebookPages;
  
          for (let i = 0; i < pages.length; i++) {
            const access_token = pages[i].access_token; // Use pages[i] instead of pages[0]
            const caption = contain.text;
            const photoPath = localUrl;
  
            const formData = new FormData();
          
            const fileBuffer =  await fs.readFile(photoPath);
            formData.append('source', fileBuffer, {
              filename: 'image3.png',
              contentType: 'image/png',
            });
            const config = {
              method: 'post',
              url: 'https://graph.facebook.com/me/photos',
              params: {
                access_token: access_token,
                caption: caption,
              },
              // headers: {
              //   ...formData.getHeaders(),
              // },
              data: formData,
            };
  
            axios(config)
              .then(response => {
                // Handle success
              })
              .catch(error => {
                // Handle error
                console.error(error);
              });
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  
  let uploadFacebookTextOnly = async (data, text) => {
  try {
    return new Promise(async(resolve, reject) => {
  let pages = data.data.facebookPages;
  for (let i = 0; i < pages.length; i++) {
  const access_token = pages[i].access_token;
  const caption = text;
  const postURL = `https://graph.facebook.com/me/feed?message=${encodeURIComponent(caption)}&access_token=${access_token}`;
  const postResponse = await axios.post(postURL);
  }
  resolve()
   })
  } catch (e) {
  }
  };
  
  
  let downloadVideo = (url) => {
  return new Promise((resolve, reject) => {
  let mainDir = __dirname.replace(".next\server\pages\api", "");
  let uploadPath = "uploads";
  let fileName = Date.now().toString() + ".png";
  let fullUploadPath = mainDir + uploadPath + fileName;
  
  const file = require("fs").createWriteStream(fullUploadPath);
  https.get(url, function (response) {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    let url = `${mainDir}${uploadPath}${fileName}`;
    resolve(url);
  });
  });
  });
  };
  

  const InstagramUploadPost = async (data, contain) => {
    const token = data.data.access_token;
    const instagramID = data.data.instagrampage.instagramID;
    try {
      const response = await axios.post(`https://graph.facebook.com/v13.0/${instagramID}/media`, null, {
        params: {
          access_token: token,
          image_url: contain.url,
          media_type: 'IMAGE',
          caption: contain.text,
        },
      });
  
      const result = response.data;
  
      setTimeout(async () => {
        let status = await checkStatus(result.id, token);
  
        if (status.status_code === 'GETSTATUS') {
          setTimeout(async () => {
            let status = await checkStatus(result.id, token);
  
            if (status.status_code === 'GETSTATUS') {
              throw new Error('Try Again');
            } else {
              let r = await instaVideoPublished(instagramID, result.id, token);
              return r;
            }
          }, 20000);
        } else {
          let r = await instaVideoPublished(instagramID, result.id, token);
          return r;
        }
      }, 20000);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const uploadLinkdinTextOnly = async (data, contain) => {
    try {
      const access_token = data.data.access_token;
      const accountID = data.data.id;
  
      const publishOptions = {
        method: 'POST',
        url: 'https://api.linkedin.com/rest/posts',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Linkedin-Version': '202302',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
        data: {
          author: `urn:li:person:${accountID}`,
          commentary: contain.text,
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false,
        },
      };
  
      await axios(publishOptions);
  
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error.message);
    }
  };
  
  
  let pinterestPost = (data, contain) => {
  return new Promise(async(resolve, reject) => {
    try{
  let refresh_token=data.data.refresh_token
  let scope=data.data.scope.replaceAll(" ", ",");
  let board_id=data.data.boardList.id
    let data1 = {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      scope: scope,
    };
    let getToken = await pinterestRefreshToken(data1);
    let access_token = getToken.access_token;
    try {
      const response = await axios.post(
      "https://api.pinterest.com/v5/pins/",
      {
        "board_id": board_id,
        "link": "https://www.pinterest.com/",
        "title": contain.text,
        "description":contain.text,
        "dominant_color": "#6E7874",
        "alt_text": contain.text,
        "media_source": {
          "source_type": "image_url",
          "url": contain.url,
        },
        "note": contain.text
  
      },
      {
        headers: {
        Authorization: `Bearer ${access_token}`,
        },
      }
      );
      resolve()
    } catch (error) {

    }
    }
    catch(erro){
  
    }
  });
  
  };
  
const linkedInPost = async (accountID, access_token, text, localurl) => {
  try {
    const stats = await fs.stat(localurl);
    if (stats) {
      const regUploadVideo = {
        method: 'POST',
        url: 'https://api.linkedin.com/rest/images?action=initializeUpload',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Linkedin-Version': '202302',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
        data: {
          initializeUploadRequest: {
            owner: `urn:li:person:${accountID}`,
          },
        },
      };

      const response = await axios(regUploadVideo);
      const uploadArr = response.data;

      if (uploadArr.value.uploadUrl) {
        await uploadbytetobytelinkedin(uploadArr.value.uploadUrl, localurl, access_token);
        const media = uploadArr.value.image;

        const publishOptions = {
          method: 'POST',
          url: 'https://api.linkedin.com/v2/ugcPosts',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Linkedin-Version': '202302',
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          data: {
            author: `urn:li:person:${accountID}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                  text: text,
                },
                shareMediaCategory: 'IMAGE',
                media: [
                  {
                    status: 'READY',
                    media: media.replace('urn:li:image', 'urn:li:digitalmediaAsset'),
                    title: {
                      text: '',
                    },
                  },
                ],
                shareCommentary: {
                  attributes: [],
                  text: text,
                },
              },
            },
            visibility: {
              'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
          },
        };
        const publishResponse = await axios(publishOptions);
        return Promise.resolve(publishResponse.data);
      }
    }
  } catch (error) {

    return Promise.reject(error.message);
  }
};



const uploadbytetobytelinkedin = (uploadurl, url, access_token) => {
  return new Promise((resolve, reject) => {
    const reader = require("fs").createReadStream(url);

    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/octet-stream',
      },
    };

    const formData = new FormData();
    formData.append('file', reader);

    axios.post(uploadurl, formData, config)
      .then((response) => {
        if (response.headers) {
          resolve();
        }
      })
      .catch((error) => {
        reject(error.message);
      });
  });
};



const pinterestRefreshToken = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auth = Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_SECRET_KEY}`).toString('base64');

      const headers = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded', // Set content type to application/x-www-form-urlencoded
      };

      // Convert the form data to a URL-encoded string
      const encodedData = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');

      const requestData = {
        method: 'POST',
        url: `https://${process.env.PINTEREST_URL}/v5/oauth/token`,
        headers: headers,
        data: encodedData, 
      };

      const response = await axios(requestData);
      const json = response.data;



      resolve(json);
    } catch (error) {

      reject(error.message);
    }
  });
};





const checkStatus = (id, token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const options = {
        method: 'GET',
        url: `https://graph.facebook.com/v13.0/${id}/`,
        params: {
          access_token: token,
          fields: 'status,status_code',
        },
      };

      const response = await axios(options);
      const result = response.data;

      if (result.status_code === 'PUBLISHED' || result.status_code === 'FINISHED') {
        resolve(result);
      } else if (result.status_code === 'ERROR') {
        reject(result);
      } else {
        resolve({ status_code: 'GETSTATUS' });
      }
    } catch (error) {
      reject(error.message);
    }
  });
};

  
const instaVideoPublished = (instagramID, media_id, token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const options = {
        method: 'POST',
        url: `https://graph.facebook.com/v13.0/${instagramID}/media_publish/`,
        params: {
          access_token: token,
          creation_id: media_id,
        },
      };

      const response = await axios(options);
      resolve(response.data);
    } catch (error) {
      reject(error.message);
    }
  });
}

module.exports={schedukeCron,socialPost}