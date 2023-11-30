import User from "../models/User.js";
import qs from "qs";
import axios from "axios";
import fs from "fs";
import sharp from "sharp";
import Counter from "../models/Counter.js";
import RequestContact from "../models/RequestContact.js";
import Contact from "../models/Contact.js";
import io from "socket.io-client";
import path from 'path'
const socket = io("https://socket.timviec365.vn/", { token: "v3" });

function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  // Bỏ các khoảng trắng liền nhau
  str = str.replace(/ + /g, " ");
  str = str.trim();

  str = str.replace(
    /!|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
    " "
  );
  return str;
}

function randomString(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const GetEmployeeInfo = async (userId) => {
  const response = await axios.post("https://chamcong.24hpay.vn/api_chat365/get_infor_user.php", qs.stringify({ id_user: userId }));
  if (response.data == null) {
    return false;
  }
  return response.data.data.userInfo;
};
export const GetInfoUser = (dataUser) => {
  const objectDataUser = dataUser.toObject();
  objectDataUser.avatarUser = objectDataUser.avatarUser
    ? `https://mess.timviec365.vn/avatarUser/${objectDataUser._id}/${objectDataUser.avatarUser}`
    : `https://mess.timviec365.vn/avatar/${objectDataUser.userName
        .substring(0, 1)
        .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
  objectDataUser["linkAvatar"] = objectDataUser.avatarUser;
  return objectDataUser;
};

export const GetCompanyInfo = async (userId) => {
  const response = await axios.get(
    `https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${userId}`
  );
  if (JSON.parse(response.data) == null) {
    return false;
  }
  return JSON.parse(response.data);
};


export const GetUserByID365 = async (id365, type365) => {
  const user = await User.findOne({ id365: id365, type365: type365 });
  if (!user) {
    return false;
  }
  return user;
};

export const UserQuitJob = async (userId) => {
  try {
    const update = {
      companyId: 0,
      companyName: 0,
      id365: 0,
      type365: 0,
    };
    const user = await User.findByIdAndUpdate(userId, update);
    if (!user) return false;
    return user;
  } catch (err) {
    if (err) {
      return false;
    }
  }
};

export const UpdateCompany = async (id, companyId, companyName, id365) => {
  try {
    const update = {
      companyId: companyId,
      companyName: companyName,
      id365: id365,
    };
    const user = await User.findByIdAndUpdate(id, update);
    if (!user) {
      return false;
    }
    return user;
  } catch (err) {
    if (err) return false;
  }
};

export const InsertNewUserService = async (
  userName,
  id365,
  idTimViec,
  type365,
  email,
  password,
  companyId,
  companyName,
  fromWeb
) => {
  try {
    const bigestId = (
      await User.find().sort({ _id: -1 }).select("_id").limit(1)
    )[0]._id;
    await Counter.findOneAndUpdate({ name: "UserID" }, { countID: bigestId +1 });
    type365 = type365 == 1 || type365 == 2 ? type365 : 0;
    password = password == null ? "" : password;
    let userCheck = await User.find({email:email});
    if(userCheck.length){
      return userCheck[0];
    }
    else{
      const newUser = await User.create({
        _id: bigestId + 1,
        id365: id365,
        type365: type365,
        email: email,
        password: password,
        userName: userName,
        idTimViec: idTimViec,
        companyId: companyId,
        companyName: companyName,
        secretCode: randomString(10),
        fromWeb: fromWeb,
        userNameNoVn: removeVietnameseTones(userName),
      });
  
      return newUser
    }
  } catch (err) {
    console.log(err)
    if (err) return false;
  }
};

export const onlyUnique = (value, index, array)=>{
  return array.indexOf(value) === index;
}

export const ToolUpdateAvatarSingle = async (id) => {
  try {
    const user = await User.find({_id:id}, { id365: 1, type365: 1 ,avatarUser:1});
    for (let i = 0; i < user.length; i++) {
      console.log(user[i]._id);
      if (user[i].type365 === 2 || user[i].type365 === 0) {
        const res1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_infor_user.php', qs.stringify({
          'id_user': Number(user[i].id365)
        }))
        if (res1.data.data && (res1.data.data.user_info.ep_image !== '') && res1.data.data.user_info.ep_image) {
          if(!res1.data.data.user_info.ep_image.includes("app_C")){
            const response = await axios({ 
              method: 'GET',
              url: `https://chamcong.24hpay.vn/upload/employee/${res1.data.data.user_info.ep_image}`,
              responseType: 'stream'
            })
            let fileName = user[i].avatarUser;
            if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)) {
              fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`);
            }
            else{
              let length = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).length;
              let stone = length -1; 
              if(length>0){
                fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).forEach(
                    (file, index) => {
                    const curPath = path.join(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`, file);
                    fs.unlink(curPath,(err) => {
                      if (err) console.log("Error delete file");
                    })
                    
                });
              };
            };
            await new Promise((resolve, reject) => {
              response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}/${fileName}`))
                .on('finish', resolve)
                .on('error', reject)
            })
          }
        }
      }
      else if (user[i].type365 === 1) {
        const res1 = await axios.get(`https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${user[i].id365}`)
        if (res1.data.data.items.length > 0 && (res1.data.data.items[0].com_logo !== '') && res1.data.data.items[0].com_logo) {
          if(!res1.data.data.items[0].com_logo.includes("C:Chat365")){ // app
             if(!res1.data.data.items[0].com_logo.includes("app")){
                const response = await axios({
                  method: 'GET',
                  url: `https://chamcong.24hpay.vn/upload/company/logo/${res1.data.data.items[0].com_logo}`,
                  responseType: 'stream'
                })
                let fileName = user[i].avatarUser;
                if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)) {
                  fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`);
                }
                else{
                  let length = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).length;
                  let stone = length -1; 
                  if(length>0){
                    fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).forEach(
                        (file, index) => {
                        const curPath = path.join(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`, file);
                        fs.unlink(curPath,(err) => {
                          if (err) console.log("Error delete file");
                        })
                        
                    });
                  };
                }
                await new Promise((resolve, reject) => {
                  response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}/${fileName}`))
                    .on('finish', resolve)
                    .on('error', reject)
                })
                //await User.findOneAndUpdate({ _id: user[i]._id }, { avatarUser: fileName }, { _id: 1 })
             }
          }
        }
      }
    }
   
  } catch (err) {
    console.log(err)
  }
}

