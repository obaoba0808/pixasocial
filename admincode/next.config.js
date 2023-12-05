 /** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false ,dns : false,net : false,tls : false,child_process : false};

    return config;
  },

    env : {
        SITE_TITLE:'PixaSocial',
        ENVIRONMENT : "prod",
        LIVE_URL : "",

        //Jwt  token details
        TOKEN_SECRET : 'PixaSocial', //Used in JWT Token
        TOKEN_LIFE : '24h',

        //Mongodb Details 
        DB_URL : ``,

        //ChatGPT API details
        OPENAI_API_KEY : '',

        //S3 Bucket Details
        SECRET_ACCESS_KEY : '',
        ACCESS_KEY_ID : '',
        REGION : '',
        MAX_UPLOAD_SIZE : '1*1024*1024*1024',
        BUCKET_NAME : 'pixasocial',
        S3_PATH : '',

        //Facebook app details
        FACEBOOK_APP_ID: "",
        FACEBOOK_SECRET_KEY : "",
        
        //Linkedin App details
        LINKEDIN_CLIENT_ID: "",
        LINKEDIN_SECRET_KEY : "",

        //Pinterest App details 
        PINTEREST_APP_ID:"",
        PINTEREST_SECRET_KEY:"",

        //Mandrill App details
        MANDRILL_KEY  : "",
        MANDRILL_EMAIL : "",

        /******Constant Details *****/
        //API Url
        PINTEREST_URL:"api.pinterest.com",

        //Redirect Url 
        FACEBOOK_REDIRECT_URL : "",
        LINKEDIN_REDIRECT_URL :  "/social/linkedin",
        PINTEREST_REDIRECT_URL : "/api/social-pintrest",
        
        //Auth Relates Data
        API_URL : '/api/',
        ALLOW_IMAGE : '.png, .PNG, .jpg, .JPG, .jpeg, .JPEG, .svg, .SVG',
        ALLOW_VIDEO : '.mp4, .MP4, .webm, .Webm',
        ALLOW_AUDIO : '.mp3, .MP3',
        TYPE : ""
    },
    reactStrictMode: false,

}

module.exports = nextConfig
