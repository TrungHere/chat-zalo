// thư viện xử lý file 
import fs from 'fs'
import path from 'path'
import axios from 'axios'

// hàm xóa folder 
const deleteFolderRecursive = async  (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file, index) => {
          const curPath = path.join(directoryPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(directoryPath);
      }
    };


// download và lưu ảnh vào thiết bị 
export const downloadImage = async (userId,imgUrl, saveRelPath,saveName) => {

    //Tạo folder chứa ảnh đại diện 
    if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`)) {
        fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`);
    }
    
    // tải ảnh và cắt ảnh 
    const _path = path.resolve(saveRelPath, saveName)
    const writer = fs.createWriteStream(_path)
    const response = await axios({
      url: imgUrl,
      method: 'GET',
      responseType: 'stream',
    })
    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}




