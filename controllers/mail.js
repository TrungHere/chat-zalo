import ManageApiMail from "../models/ManageApiMail.js";
import * as nodemailer from 'nodemailer'
import { createError } from "../utils/error.js";
function sendJob3sQlc(title,content,receiver){
    return new Promise((resolve,reject)=>{
        let transporter = nodemailer.createTransport({
          service:'gmail',
          auth:{
            user:'cskhjob3s@gmail.com',
            pass:'najjmukovhfluzta'
          }
        });
        const mail_config = {
           from:'cskhjob3s@gmail.com',
           to:receiver,
           subject:title,
           html: `${content}`
        };
        transporter.sendMail(mail_config, function(error,info){
            if(error){
               console.log(error);
               return reject({message:"Đã có lỗi xảy ra khi gửi mail"});
            };
            return resolve({message:"Gửi mail thành công"})
        });
    })
  }

export const sendMailJob3sApi = async (req,res)=>{
    try{
       if(req.body && req.body.title && req.body.content && req.body.receiver){
           sendJob3sQlc(req.body.title,req.body.content,req.body.receiver)
           res.json({
              data:{
                 result:true
              },
              error:null
           })
       }
       else{
          res.status(200).json(createError(200, "Infor is not valid"));
       }
    } catch(e){
       console.log(e);
       res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
  }




//   const transporter = nodemailer.createTransport({
//     service:'gmail',
//     auth:{
//     user:'vieclam.timviec365.vn@gmail.com ',
//     pass:'rboemxcnewlpkraf'
//     }
//   });
//   function FsendMailMarketing142(title,content,receiver){
//     return new Promise((resolve,reject)=>{
//         const transporter = nodemailer.createTransport({
//             service:'gmail',
//             //pool: true,
//             auth:{
//             user:'hungha.timviec365.01@gmail.com',
//             pass:'smcmpnmdkxkqagdl'
//             }
//           });
//         const mail_config = {
//             from:'hungha.timviec365.01@gmail.com',
//             to:receiver,
//             subject:title,
//             html: `${content}`
//         };
//         transporter.sendMail(mail_config, function(error,info){
//             if(error){
//                 console.log(error);
//                 return reject({message:"Đã có lỗi xảy ra khi gửi mail"});
//             };
//             return resolve({message:"Gửi mail thành công"})
//         });
//         transporter.close();
//     })
// }

// export const sendMailMarketing142 = async (req,res)=>{
//     try{
//         if(req.body && req.body.title && req.body.content && req.body.receiver){
//         FsendMailMarketing142(req.body.title,req.body.content,req.body.receiver)
//             res.json({
//                 data:{
//                     result:true
//                 },
//                 error:null
//             })
//         }
//         else{
//             res.status(200).json(createError(200, "Infor is not valid"));
//         }
//     } catch(e){
//         console.log(e);
//         res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
//     }
// }

