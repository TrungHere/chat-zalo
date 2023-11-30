export const fInfoLink = (messageId,title,description,linkHome,image, isNotification) => {
    let HaveImage;
    let Image = image;
    if ((!image) || (String(image).trim() ==="") )
    {
        HaveImage = "False";
    }
    else
    {
        HaveImage = "True";
    }
    if(HaveImage == "True"){
     Image=  Image.replace("amp;","")
    }
    return {
     messageID:messageId,
     typeLink:"link",
     description:description,
     title:title,
     linkHome:linkHome,
     image:Image,
     haveImage:HaveImage,
     isNotification:isNotification
    }
 };

 export const fInfoFile = (typeFile,fullName,sizeFile,height, width) => {
    let nameDisplay = String(fullName).split("-")[1];
    const nameDownload = String(fullName).replace(/[ +!@#$%^&*]/g, '');
    if( (String(nameDisplay).trim() != "") && String(nameDisplay).length>25 ){
        nameDisplay = `${String(nameDisplay).slice(0,23)}...`;
    }
    let FileSizeInByte= Number(sizeFile);
    if(Number(sizeFile)<1024){
        FileSizeInByte = `${FileSizeInByte} bytes`;
    }
    else if( (Number(sizeFile)/1024 >= 1) && ( Number(sizeFile)/1024 < 1024 ) ){
        FileSizeInByte =  `${String(FileSizeInByte/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} KB`
    }
    else if( (Number(sizeFile)/1024)/1024 >= 1){
        FileSizeInByte =  `${String((FileSizeInByte/1024)/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} MB`
    }
    return {
        typeFile:"sendFile",
        fullName:fullName,
        sizeFile:sizeFile,
        imageSource:null,
        height:height,
        width: width,
        nameDisplay,
        nameDownload,
        fileSizeInByte:FileSizeInByte
    }
 };

 export const fInfoFile2 = (typeFile,fullName,sizeFile,height, width) => {
    let nameDisplay = String(fullName).split("-")[1];
    const nameDownload = String(fullName).replace(/[ +!@#$%^&*]/g, '')
    if( (String(nameDisplay).trim() != "") && String(nameDisplay).length>25 ){
        nameDisplay = `${String(nameDisplay).slice(0,23)}...`;
    }
    let FileSizeInByte= Number(sizeFile);
    if(Number(sizeFile)<1024){
        FileSizeInByte = `${FileSizeInByte} bytes`;
    }
    else if( (Number(sizeFile)/1024 >= 1) && ( Number(sizeFile)/1024 < 1024 ) ){
        FileSizeInByte =  `${String(FileSizeInByte/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} KB`
    }
    else if( (Number(sizeFile)/1024)/1024 >= 1){
        FileSizeInByte =  `${String((FileSizeInByte/1024)/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} MB`
    }
    return {
        typeFile:typeFile,
        fullName:fullName,
        sizeFile:sizeFile,
        imageSource:null,
        height:height,
        width: width,
        nameDisplay,
        nameDownload,
        fileSizeInByte:FileSizeInByte
    }
 };
 export const fEmotion = (type,listUserId,linkEmotion) => {
  
    return {
        type:type,
        listUserId:listUserId,
        linkEmotion:linkEmotion,
        isChecked:false
    }
 };
 
 export const fMessageQuote = (messageID,senderName,senderID,messageType,message,createAt) => {
    let createAtTime = new Date(createAt);
    return {
        messageID : messageID,
        senderID : senderID,
        messageType : messageType,
        message : message,
        createAt : `${JSON.parse(JSON.stringify(new Date(createAtTime.setHours(createAtTime.getHours() + 7)))).replace("Z","")}+07:00`,
        senderName : senderName
    }
 };