import Conversation from "../models/Conversation.js";
import {urlImgHost} from '../utils/config.js'
export const test = async (req,res,next)=>{
    try {
      console.log(req.body);
      let findword= req.body.findword;
      //let query= new RegExp(String(findword),'i')
      let query=new RegExp(findword, "i");
      const conversations = await Conversation.aggregate([
        { $match: 
          {
              "memberList.memberId":req.body.userId,
              "messageList.message":new RegExp(findword,'i')
          }
        },
        { $limit : 20 },  
        { $sort: {timeLastMessage:-1}},
        {
          $project: {
            messageList: {
              $slice: [  
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: { 
                      $and:[
                        {
                          $regexMatch: {
                            input: "$$messagelist.message",  
                            regex: query
                          }
                        },
                        {$lte: [ "$$messagelist.createAt", new Date() ]}  
                      ]
                    },
                  }
                },
                -10
               ]
             }
          }
        }
      ]);
      res.status(200).json(conversations);
    } catch (err) {
      console.log(err);
    }
  }

// api tìm ra tin nhắn thỏa mãn 
export const findmes = async (req,res,next)=>{
    try {
      console.log(req.body);
      let timeCreate;
      let results=[];
      let findword = req.body.findword;
      // tin nhắn được lấy ra trong lần đầu tiên sẽ có thời gian nhỏ nhất 
      let conversation_result = await Conversation.find(
        {_id:req.body._id,"messageList.message":new RegExp(findword,'i')}, // điều kiện lấy cuộc trò chuyện
        {messageList:
          {
            $elemMatch:{message:new RegExp(findword,'i')}
          }
        },// điều kiện lấy tin nhắn
      );
      results.push(conversation_result);
      timeCreate= conversation_result[0].messageList[0].createAt;
      timeCreate.setMilliseconds(timeCreate.getMilliseconds() + 1);
      for(let i=1;i<5;i++){
        let conversationsf = await Conversation.find(
          {_id:req.body._id,"messageList.message":new RegExp(findword,'i')}, // điều kiện lấy cuộc trò chuyện
          {messageList:
            {
              $elemMatch:{message:new RegExp(findword,'i'),createAt:{ $gte: new Date(timeCreate)}}
            }
          },// điều kiện lấy tin nhắn
        );
        //console.log(conversationsf);
        //console.log("tin nhắn nhận về",conversationsf[0].messageList[0]);
        if(conversationsf && ( conversationsf[0].messageList.length > 0)){
          timeCreate= conversationsf[0].messageList[0].createAt;
          timeCreate.setMilliseconds(timeCreate.getMilliseconds() + 1);
          console.log("Thêm dữ liệu")
          results.push(conversationsf[0]);
        }
        else{
          break;
        }
      }
      res.status(200).json(results);
    } catch (err) {
      console.log(err);
    }
}

export const findRelativeMes = async (req,res,next)=>{
  try {
    console.log(req.body);
    let results=[];
    const conversationsup = await Conversation.aggregate([
      { $match: 
        {
          $and:[
            {_id:req.body._id},
          ]
        }
      },
      { $limit : 1 },
      {
        $project: {
          messageList: {
            $slice: [  // để giới hạn kết quả trả về 
              {
                $filter: {
                  input: "$messageList",
                  cond: { $gte: [ "$$messagelist.createAt", new Date(req.body.time) ] },
                  as: "messagelist",
                }
              },
              5
             ]
           }
        }
      }
    ]);
    const conversationsdown = await Conversation.aggregate([
      { $match: 
        {
          $and:[
            {_id:req.body._id},
          ]
        }
      },
      { $limit : 1 },
      {
        $project: {
          messageList: {
            $slice: [  // để giới hạn kết quả trả về 
              {
                $filter: {
                  input: "$messageList",
                  cond: { $lt: [ "$$messagelist.createAt", new Date(req.body.time) ] },
                  as: "messagelist",
                }
              },
              5
             ]
           }
        }
      }
    ]);
    for(let i=4;i>=0;i--){
      if(conversationsdown[0].messageList[i]){
        results.push(conversationsdown[0].messageList[i]);
      }
      if(conversationsup[0].messageList[i]){
        results.push(conversationsup[0].messageList[i]);
      }
    }
    // sắp xếp theo thời gian
    results.sort((a, b)=> {
      if (new Date(a.createAt) < new Date(b.createAt)) {
        return -1;
      }
      if (new Date(a.createAt) > new Date(b.createAt)) {
        return 1;
      }
      return 0;
    });
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
  }
}


export const findEachMes = async (req,res,next)=>{
  try {
    console.log(req.body);
    if(req && req.body && req.body._id && req.body.findword){
      let findword = req.body.findword;
      let results=[];
      let time_result; 
      let time_result_before; 
      let conversation_finded;

      if((req.body.time=="0")){ 
        conversation_finded = await Conversation.aggregate([
          { $match: 
                {_id:Number(req.body._id)},
          },
          { $limit : 1 }, 
          {
            $project: {
              messageList: {
                $slice: [  
                  {
                    $filter: {
                      input: "$messageList",
                      as: "messagelist",
                      cond: { 
                        $and:[
                          {
                            $regexMatch: {
                              input: "$$messagelist.message",  
                              regex: new RegExp(findword,'i')
                            }
                          },
                          { $ne: ["$$messagelist.messageType", 'notification'] },
                          { $ne: ["$$messagelist.isEdited", 3] },
                          { $ne: ["$$messagelist.isEdited", 2] },
                          {$lte: [ "$$messagelist.createAt", new Date() ]} 
                        ]
                      },
                    }
                  },
                  -50  
                 ]
               }
            }
          }
        ]);
      }
      else{
        time_result_before= new Date(req.body.time);
        if(time_result_before){
          time_result_before.setMilliseconds(time_result_before.getMilliseconds() - 1);  
          conversation_finded = await Conversation.aggregate([
            { $match: 
                  {_id:Number(req.body._id)},
            },
            { $limit : 1 },  
            {
              $project: {
                messageList: {
                  $slice: [  
                    {
                      $filter: {
                        input: "$messageList",
                        as: "messagelist",
                        cond: { 
                          $and:[
                            {
                              $regexMatch: {
                                input: "$$messagelist.message",  
                                regex: new RegExp(findword,'i')
                              }
                            },
                            { $ne: ["$$messagelist.messageType", 'notification'] },
                            { $ne: ["$$messagelist.isEdited", 3] },
                            { $ne: ["$$messagelist.isEdited", 2] },
                            {$lte: [ "$$messagelist.createAt", time_result_before ]}   
                          ]
                        },
                      }
                    },
                    -1
                   ]
                 }
              }
            }
          ]);
        }
        else{
          res.send("Thời gian không hợp lệ")
        }
      }
      if(conversation_finded && (conversation_finded[0].messageList.length > 0)){
        let count_results=conversation_finded[0].messageList.length; 
        results.push(conversation_finded[0].messageList[count_results-1]);
        time_result=conversation_finded[0].messageList[count_results-1].createAt;
        if(time_result){
          const conversationsup = await Conversation.aggregate([
            { $match: 
              {
                $and:[
                  {_id:Number(req.body._id)},
                ]
              }
            },
            { $limit : 1 },
            {
              $project: {
                messageList: {
                  $slice: [  
                    {
                      $filter: {
                        input: "$messageList",
                        cond: { $gte: [ "$$messagelist.createAt", new Date(time_result) ] },
                        as: "messagelist",
                      }
                    },
                    5
                   ]
                 }
              }
            }
          ]);
          const conversationsdown = await Conversation.aggregate([
            { $match: 
              {
                $and:[
                  {_id:Number(req.body._id)},
                ]
              }
            },
            { $limit : 1 },
            {
              $project: {
                messageList: {
                  $slice: [  
                    {
                      $filter: {
                        input: "$messageList",
                        cond: { $lt: [ "$$messagelist.createAt", new Date(time_result) ] },
                        as: "messagelist",
                      }
                    },
                    -5
                   ]
                 }
              }
            }
          ]);
          for(let i=4;i>=0;i--){
            if(conversationsdown[0].messageList[i]){
              results.push(conversationsdown[0].messageList[i]);
            }
            if(conversationsup[0].messageList[i]){
              results.push(conversationsup[0].messageList[i]);
            }
          }
          results.sort((a, b)=> {
            if (new Date(a.createAt) < new Date(b.createAt)) {
              return -1;
            }
            if (new Date(a.createAt) > new Date(b.createAt)) {
              return 1;
            }
            return 0;
          });
          for(let j=0; j< results.length; j++) {
            if(results[j].listFile && results[j].listFile.length>0){
              let listFile = results[j].listFile;
              for(let h=0; h< listFile.length; h++) {
                 results[j].listFile[h].fullName = listFile[h].nameFile; 
                 if(listFile[h].nameFile.split("-")[1].length > 23) {
                  listFile[h].nameDisplay= `${listFile[h].nameFile.split("-")[1].slice(0, 23)}...`
                 }
                 
                 let num = Number(listFile[h].sizeFile) /1024;
                 if(num<1024){
                  if(String(num).split(".").length>1){
                    num= `${String(num).split(".")[0]}.${String(num).split(".")[1].slice(0,2)}KB`;
                  }
                  else{
                    num =`${String(num)}KB`;
                  }
                   listFile[h].fileSizeInByte= num;
                 }
                 else{
                  num= num /1024;
                  if(String(num).split(".").length>1){
                    num= `${String(num).split(".")[0]}.${String(num).split(".")[1].slice(0,2)}MB`;
                  }
                  else{
                    num =`${String(num)}MB`;
                  }
                   listFile[h].fileSizeInByte= num;
                 }
                 
                 listFile[h].typeFile= results[j].messageType;
                 
                 delete listFile[h].nameFile; 


              }
            }
          }
          res.status(200).json({
            data:{
              result:true,
              message:"Lấy thông tin thành công",
              list_mes:results,
              mes_finded:conversation_finded[0].messageList[count_results-1],
              count_results
            },
            error:null
          });
        }
        else{
          res.send("Tin nhắn không phù hợp")
        }
      }
      else{
        res.send("Không tìm thấy tin nhắn phù hợp")
      }
    }
    else{
      console.log("Request không hợp lệ");
      res.send("Request không hợp lệ")
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
}

export const findEachMes_param = async(req,res,next)=>{
  try {
    console.log(req.params);
    if(req && req.params && req.params._id && req.params.findword){
      let findword = req.params.findword;
      let results=[];
      let time_result; 
      let time_result_before; 
      let conversation_finded;

      if((req.params.time=="0")){ 
        conversation_finded = await Conversation.aggregate([
          { $match: 
                {_id:Number(req.params._id)},
          },
          { $limit : 1 }, 
          {
            $project: {
              messageList: {
                $slice: [  
                  {
                    $filter: {
                      input: "$messageList",
                      as: "messagelist",
                      cond: { 
                        $and:[
                          {
                            $regexMatch: {
                              input: "$$messagelist.message",  
                              regex: new RegExp(findword,'i')
                            }
                          },
                          { $ne: ["$$messagelist.messageType", 'notification'] },
                          { $ne: ["$$messagelist.isEdited", 3] },
                          {$lte: [ "$$messagelist.createAt", new Date() ]} 
                        ]
                      },
                    }
                  },
                  -50  
                 ]
               }
            }
          }
        ]);
        console.log(conversation_finded[0].messageList.length)
      }
      else{
        time_result_before= new Date(req.params.time);
        if(time_result_before){
          time_result_before.setMilliseconds(time_result_before.getMilliseconds() - 1);  
          conversation_finded = await Conversation.aggregate([
            { $match: 
                  {_id:Number(req.params._id)},
            },
            { $limit : 1 },  
            {
              $project: {
                messageList: {
                  $slice: [  
                    {
                      $filter: {
                        input: "$messageList",
                        as: "messagelist",
                        cond: { 
                          $and:[
                            {
                              $regexMatch: {
                                input: "$$messagelist.message",  
                                regex: new RegExp(findword,'i')
                              }
                            },
                            { $ne: ["$$messagelist.messageType", 'notification'] },
                            { $ne: ["$$messagelist.isEdited", 3] },
                            {$lte: [ "$$messagelist.createAt", time_result_before ]}   
                          ]
                        },
                      }
                    },
                    -1
                   ]
                 }
              }
            }
          ]);
        }
        else{
          res.send("Thời gian không hợp lệ")
        }
      }
      if(conversation_finded && (conversation_finded[0].messageList.length > 0)){
        let count_results=conversation_finded[0].messageList.length; // số lượng tin nhắn tìm đc 
        results.push(conversation_finded[0].messageList[count_results-1]);
        time_result=conversation_finded[0].messageList[count_results-1].createAt;
        if(time_result){
          const conversationsup = await Conversation.aggregate([
            { $match: 
              {
                $and:[
                  {_id:Number(req.params._id)},
                ]
              }
            },
            { $limit : 1 },
            {
              $project: {
                messageList: {
                  $slice: [  // để giới hạn kết quả trả về 
                    {
                      $filter: {
                        input: "$messageList",
                        cond: { $gte: [ "$$messagelist.createAt", new Date(time_result) ] },
                        as: "messagelist",
                      }
                    },
                    5
                   ]
                 }
              }
            }
          ]);
          const conversationsdown = await Conversation.aggregate([
            { $match: 
              {
                $and:[
                  {_id:Number(req.params._id)},
                ]
              }
            },
            { $limit : 1 },
            {
              $project: {
                messageList: {
                  $slice: [  // để giới hạn kết quả trả về 
                    {
                      $filter: {
                        input: "$messageList",
                        cond: { $lt: [ "$$messagelist.createAt", new Date(time_result) ] },
                        as: "messagelist",
                      }
                    },
                    -5
                   ]
                 }
              }
            }
          ]);
          for(let i=4;i>=0;i--){
            if(conversationsdown[0].messageList[i]){
              results.push(conversationsdown[0].messageList[i]);
            }
            if(conversationsup[0].messageList[i]){
              results.push(conversationsup[0].messageList[i]);
            }
          }
            //sắp xếp theo thời gian
          results.sort((a, b)=> {
            if (new Date(a.createAt) < new Date(b.createAt)) {
              return -1;
            }
            if (new Date(a.createAt) > new Date(b.createAt)) {
              return 1;
            }
            return 0;
          });
          for(let j=0; j< results.length; j++) {
            if(results[j].listFile && results[j].listFile.length>0){
              let listFile = results[j].listFile;
              for(let h=0; h< listFile.length; h++) {
                 results[j].listFile[h].fullName = listFile[h].nameFile; // full name 
                 // tên hiển thị 
                 if(listFile[h].nameFile.split("-")[1].length > 23) {
                  listFile[h].nameDisplay= `${listFile[h].nameFile.split("-")[1].slice(0, 23)}...`
                 }
                 
                 // xử lý kích thước dạng KB.
                 let num = Number(listFile[h].sizeFile) /1024;
                 if(num<1024){
                  if(String(num).split(".").length>1){
                    num= `${String(num).split(".")[0]}.${String(num).split(".")[1].slice(0,2)}KB`;
                  }
                  else{
                    num =`${String(num)}KB`;
                  }
                   listFile[h].fileSizeInByte= num;
                 }
                 else{
                  num= num /1024;
                  if(String(num).split(".").length>1){
                    num= `${String(num).split(".")[0]}.${String(num).split(".")[1].slice(0,2)}MB`;
                  }
                  else{
                    num =`${String(num)}MB`;
                  }
                   listFile[h].fileSizeInByte= num;
                 }
                 
                 // xử lý TypeFile 
                 listFile[h].typeFile= results[j].messageType;
                 
                 delete listFile[h].nameFile; // xóa trường 


              }
            }
          }
          res.status(200).json({
            data:{
              result:true,
              message:"Lấy thông tin thành công",
              list_mes:results,
              mes_finded:conversation_finded[0].messageList[count_results-1],
              count_results
            },
            error:null
          });
        }
        else{
          res.send("Tin nhắn không phù hợp")
        }
      }
      else{
        res.send("Không tìm thấy tin nhắn phù hợp")
      }
    }
    else{
      console.log("Request không hợp lệ");
      res.send("Request không hợp lệ")
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
}

export const LoadMessage = async(req,res,next)=>{
  try {
     
  } catch (err) {
   
  }
}