
import User from "../../models/User.js";
import Counter from "../../models/Counter.js";
export const checkMailEmpty365 = async (Email) => {
    let result = await User.find({email:String(Email)}).lean();
    return result;
};

export const UpdateInfoUser = async ( id,  id365,  type365,  userName, avatar,  password,  companyId,  companyName,  idTimViec) => {
  let filter = { _id: Number(id) };
  let update;
  if(Number(type365)==0){
      update = { $set: {
      id365: id365, 
      idTimViec: idTimViec, 
      type365:type365, 
      userName:userName,
      avatarUser:avatar,
      password:password,
      companyId:companyId,
      companyName:companyName
    } };
  }
  else{
      update = { $set: {
      id365: id365, 
      idTimViec: idTimViec, 
      type365:type365, 
      userName:userName,
      avatarUser:avatar,
      companyId:companyId,
      companyName:companyName
    } };
  }
  
  let result = await User.findOneAndUpdate(filter, update, {new: true});
  if(result._id == Number(id)){
    return 1;
  }
  else{
    return 0;
  }
};

export const RandomString =(length)=>{
    var result           = '';
    var characters       = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
    charactersLength));
    }
    return result;
}
export const InsertNewUserExtra = async ( userName,  id365,  idTimViec,  type365,  email,  password,  companyId,  companyName,  fromWeb) => {
  try{
      console.log("Inser dữ liệu công ty ")
      let result = await User.find({_id:{$ne:0}},{_id:1}).sort({_id:-1}).limit(1);
      let count_doc_Users= Number(result[0]._id);  // do thiếu dữ liệu 
      let update = await Counter.updateOne({name:"UserID"},{$set:{countID:count_doc_Users+1}})
      if(update){
        const newUser = new User({
            _id: count_doc_Users+1,  
            id365: id365,
            type365:  type365,
            email: email,
            password: password,
            phone:"",
            userName:userName,
            avatarUser:"",
            status: "",
            statusEmotion:0,
            lastActive: new Date(),
            active: 1,
            isOnline: 0,
            looker: 0,
            companyId: companyId,
            companyName: companyName,
            notificationPayoff:1,
            notificationCalendar: 1,
            notificationReport: 1,
            notificationOffer: 1,
            notificationPersonnelChange: 1,
            notificationRewardDiscipline: 1,
            notificationNewPersonnel: 1,
            notificationChangeProfile: 1,
            notificationTransferAsset: 1,
            acceptMessStranger: 1,
            idTimViec: idTimViec,
            fromWeb: String(fromWeb),
            secretCode:RandomString(10),
            IdDevice:"",
            IpAddress:"",
            NameDevice:""
        });
        const savedUser = await newUser.save();
        return Number(savedUser._id);
      }
      else{
        return 0;
      }
     
  }
  catch (err) {
      console.log(err);
      return 0;
  }
};

// tìm kiếm bằng id365 và loại 
export const GetUserByID365 = async (id365,type365)=>{
  try{
     let result = [];
     if(Number(id365)&& Number(type365)){
       result = await User.find({id365:Number(id365),type365:Number(type365)}).lean();
       return result;
     }
     else{
      return [];
     }
  }
  catch(e){
    return [];
  }
}