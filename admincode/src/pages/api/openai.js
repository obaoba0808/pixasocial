const {handleError ,updateReqResp , dbQuery , customValidator} = require("./lib/commonLib");
var axios = require("axios");


export default async function handler(req, res) {
    try{
        if(req.method == 'POST'){
            if(req.body.action=="ImageGenrate"){
                imageGenrate(req,res)
            }else{
                aiTextGenration(req, res);
            }
        }
    }catch (error){
        handleError(error , 'AuthAPI');
    }
}


let aiTextGenration=async(req,res)=>{
    customValidator(
        {
            data: req.body,
            keys: {
              
            },
        },
        req,
        res,
        async ({authData} = validateResp) => { 
            let { content} = req.body;

            
            const apiUrl = 'https://api.openai.com/v1/engines/dalle-generate/completions';

            axios.post(apiUrl, {
            prompt: content,
            }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            })
            .then(response => {
                if(response){
                    res.status(200).json({ 
                        data : response ,
                        status : true,
                        message : 'Text generate sucessfully.'
                    })
                }
            })
            .catch(error => {
                console.error(error);
            });
         
            
        })
}


let imageGenrate =async(req,res)=>{
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
                let { content} = req.body;
        const response = await axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            prompt: content,
            n: 1,                                
            size: '512x512',                     
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );
        res.status(200).json({ 
            data : response.data ,
            status : true,
            message : 'Image genrate sucessfully'
        })
    })
      } catch (error) {
  
      }
    
}