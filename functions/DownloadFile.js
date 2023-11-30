
import fs from 'fs';
import axios from 'axios';
import path from 'path'

export const downloadFile = async (url, type) => {
   try {
      if ((String(type) === "pdf") || (String(type) === "png")) {
         const __dirname = path.resolve();
         const fileName = `${Date.now() * 10000 + 621355968000000000}cv.${type}`;
         const path1 = path.resolve(__dirname, '/root/app/storage/chat365/uploads', fileName)
         const writer = fs.createWriteStream(path1)

         const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
         })

         response.data.pipe(writer)
         return fileName;
      }
      else {
         return false;
      }
   }
   catch (e) {
      console.log(e);
      return false;
   }

}

export const downloadFile_v2 = async (url, type) => {
   try {
      if (String(type) === "png") {
         const __dirname = path.resolve();
         const fileName = `${Date.now() * 10000 + 621355968000000000}cv.${type}`;
         const path1 = path.resolve(__dirname, 'public', fileName)
         const writer = fs.createWriteStream(path1)

         const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
         })

         console.log(response)
         response.data.pipe(writer)
         return fileName;
      }
      else if (String(type) === "pdf") {
         const src = url.split('/').slice(3).join('/');
         const fileName = `${Date.now() * 10000 + 621355968000000000}cv.${type}`;
         // Kiểm tra xem tệp nguồn có tồn tại không
         if (!fs.existsSync(`/root/app/storage/base365/${src}`)) {
            console.log(`File CV không tồn tại`);
            return false;
         }
         fs.copyFileSync(`/root/app/storage/base365/${src}`, `/root/app/storage/chat365/uploads/${fileName}`)
         return fileName
      }
      else {
         return false;
      }
   }
   catch (e) {
      console.log(e);
      return false;
   }

}

export const convertBase64ToPDF = async (base64Data) => {
   try {
      const buffer = Buffer.from(base64Data, 'base64');
      const __dirname = path.resolve();
      const fileName = `${Date.now() * 10000 + 621355968000000000}cv.pdf`;
      const path1 = path.resolve(__dirname, '/root/app/storage/chat365/uploads', fileName)
      fs.writeFile(path1, buffer, (err) => {
         if (err) {
            console.error('Lỗi khi ghi tệp PDF:', err);
            return false
         } else {
            console.log('Tệp PDF đã được tạo thành công:');
            return fileName
         }
      });
   } catch (e) {
      console.log(e);
      return false;
   }
};